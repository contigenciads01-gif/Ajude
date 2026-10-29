/**
 * Sistema de Checkout PIX Seguro
 * Integração com API Proxy Supabase via Vercel Serverless Function (/api/create-pix)
 */
(function() {
    'use strict';

    var state = {
        selectedAmount: 100,
        chargeId: null,
        pollInterval: null,
        isPolling: false
    };

    function formatCPF(v) {
        v = (v || '').replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        return v;
    }

    function showStep(stepName) {
        var steps = ['select', 'form', 'pix', 'success'];
        steps.forEach(function(s) {
            var el = document.getElementById('pixStep-' + s);
            if (el) {
                if (s === stepName) {
                    el.classList.add('is-active');
                } else {
                    el.classList.remove('is-active');
                }
            }
        });

        var modalTitle = document.getElementById('campaignDonateModalTitle');
        var modalSub = document.querySelector('#donateModal .donate-modal-subtitle');

        if (stepName === 'select') {
            if (modalTitle) modalTitle.textContent = 'Quanto você consegue hoje? 🧡';
            if (modalSub) modalSub.textContent = 'CADA VALOR AJUDA O VICENTE';
        } else if (stepName === 'form') {
            if (modalTitle) modalTitle.textContent = 'Identificação para Doação';
            if (modalSub) modalSub.textContent = 'SEUS DADOS ESTÃO 100% SEGUROS';
        } else if (stepName === 'pix') {
            if (modalTitle) modalTitle.textContent = 'Pague com PIX';
            if (modalSub) modalSub.textContent = 'QR CODE E CÓDIGO COPIA E COLA';
        } else if (stepName === 'success') {
            if (modalTitle) modalTitle.textContent = 'Muito Obrigado! ❤️';
            if (modalSub) modalSub.textContent = 'DOAÇÃO CONFIRMADA COM SUCESSO';
        }
    }

    function stopPolling() {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = null;
        }
        state.isPolling = false;
    }

    window.resetDonateModalStep = function() {
        stopPolling();
        showStep('select');
    };

    window.selectDonationAmount = function(amount) {
        var parsed = parseInt(amount, 10);
        if (isNaN(parsed) || parsed < 5) parsed = 50;
        state.selectedAmount = parsed;

        var valBadges = document.querySelectorAll('.pixSelectedAmountText');
        valBadges.forEach(function(b) {
            b.textContent = 'R$ ' + parsed + ',00';
        });

        if (typeof window.openDonateModal === 'function') {
            window.openDonateModal();
        } else {
            var m = document.getElementById('donateModal');
            if (m) m.style.display = 'flex';
        }

        var exitPopup = document.getElementById('exitIntentPopup');
        if (exitPopup) exitPopup.classList.remove('is-visible');

        showStep('form');
    };

    async function createPixCharge(amountCents, name, documentNumber) {
        var payload = {
            amount_cents: amountCents,
            payer: {
                name: name,
                document: documentNumber
            }
        };

        var res = await fetch('/api/create-pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        var data = await res.json();
        if (res.ok && data && data.ok && data.charge) {
            return data.charge;
        }

        throw new Error(data.message || data.error || 'Não foi possível gerar a cobrança PIX.');
    }

    async function checkChargeStatus(id) {
        try {
            var res = await fetch('/api/check-pix?id=' + encodeURIComponent(id));
            if (res.ok) {
                var data = await res.json();
                if (data && data.charge) return data.charge;
            }
        } catch (e) {}
        return null;
    }

    function startPolling(id) {
        stopPolling();
        state.isPolling = true;
        state.pollInterval = setInterval(async function() {
            if (!state.isPolling) return;
            var charge = await checkChargeStatus(id);
            if (charge && charge.status === 'paid') {
                stopPolling();
                showStep('success');
            }
        }, 3000);
    }

    document.addEventListener('DOMContentLoaded', function() {
        var form = document.getElementById('pixPayerForm');
        var nameInput = document.getElementById('pixPayerName');
        var docInput = document.getElementById('pixPayerDocument');
        var submitBtn = document.getElementById('pixSubmitBtn');
        var backBtn = document.getElementById('pixBackBtn');
        var copyBtn = document.getElementById('pixCopyBtn');
        var copyInput = document.getElementById('pixCopyCodeInput');
        var qrImg = document.getElementById('pixQrCodeImg');

        if (docInput) {
            docInput.addEventListener('input', function() {
                this.value = formatCPF(this.value);
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showStep('select');
            });
        }

        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                var name = (nameInput ? nameInput.value : '').trim();
                var doc = (docInput ? docInput.value : '').replace(/\D/g, '');

                if (!name || name.length < 3) {
                    alert('Por favor, informe seu nome completo.');
                    if (nameInput) nameInput.focus();
                    return;
                }

                if (doc.length !== 11) {
                    alert('Por favor, informe um CPF válido com 11 dígitos.');
                    if (docInput) docInput.focus();
                    return;
                }

                var originalText = submitBtn ? submitBtn.innerHTML : '';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>⏳ Gerando PIX seguro...</span>';
                }

                try {
                    var amountCents = state.selectedAmount * 100;
                    var charge = await createPixCharge(amountCents, name, doc);

                    state.chargeId = charge.id;

                    if (qrImg && charge.qr_code_image) {
                        qrImg.src = charge.qr_code_image;
                    }

                    if (copyInput && charge.qr_code) {
                        copyInput.value = charge.qr_code;
                    }

                    showStep('pix');
                    startPolling(charge.id);
                } catch (err) {
                    alert('Erro ao gerar cobrança PIX: ' + (err.message || 'Tente novamente'));
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                }
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var code = copyInput ? copyInput.value : '';
                if (!code) return;

                function onCopySuccess() {
                    copyBtn.classList.add('is-copied');
                    copyBtn.innerHTML = '<span>✅ CÓDIGO PIX COPIADO!</span>';
                    setTimeout(function() {
                        copyBtn.classList.remove('is-copied');
                        copyBtn.innerHTML = '<span>📋 COPIAR CÓDIGO PIX</span>';
                    }, 3500);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(code).then(onCopySuccess).catch(function() {
                        if (copyInput) {
                            copyInput.select();
                            document.execCommand('copy');
                            onCopySuccess();
                        }
                    });
                } else if (copyInput) {
                    copyInput.select();
                    document.execCommand('copy');
                    onCopySuccess();
                }
            });
        }

        document.addEventListener('click', function(e) {
            var link = e.target.closest && e.target.closest('a[href*="valor="], .donation-link');
            if (!link) return;

            var href = link.getAttribute('href') || '';
            var match = href.match(/valor=(\d+)/);
            var val = null;

            if (match && match[1]) {
                val = parseInt(match[1], 10);
            } else {
                var txt = link.textContent || '';
                var numMatch = txt.match(/R\$\s*([\d.]+)/);
                if (numMatch && numMatch[1]) {
                    val = parseInt(numMatch[1].replace(/\./g, ''), 10);
                }
            }

            if (val) {
                e.preventDefault();
                e.stopPropagation();
                window.selectDonationAmount(val);
            }
        }, true);
    });
})();
