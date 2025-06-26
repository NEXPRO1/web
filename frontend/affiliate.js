// frontend/affiliate.js
console.log('affiliate.js loaded');
window.Affiliate = {
    affiliateDashboardSection: null,
    affiliateLinkDisplay: null,
    statsTotalSignups: null,
    statsTotalOrders: null,
    statsPendingCommission: null,
    statsPaidCommission: null,
    affiliateReferralsList: null,

    initAffiliateElements: function() {
        this.affiliateDashboardSection = document.getElementById('affiliate-dashboard');
        this.affiliateLinkDisplay = document.getElementById('affiliate-link-display');
        this.statsTotalSignups = document.getElementById('stats-total-signups');
        this.statsTotalOrders = document.getElementById('stats-total-orders');
        this.statsPendingCommission = document.getElementById('stats-pending-commission');
        this.statsPaidCommission = document.getElementById('stats-paid-commission');
        this.affiliateReferralsList = document.getElementById('affiliate-referrals-list');
    },

   fetchAffiliateDashboardData: async function() {
       const token = localStorage.getItem('authToken');
       
       if (!this.affiliateDashboardSection) {
           // console.warn("Affiliate elements not initialized yet in fetchAffiliateDashboardData. Skipping fetch.");
           return;
       }

       // No hacer fetch si el dashboard está oculto o no hay token.
       // La visibilidad del dashboard se maneja en Auth.updateAuthStateUI.
       // Si Auth.updateAuthStateUI llama a esta función, asumimos que es porque el dashboard debería estar visible.
       if (!token) {
           // console.log("No token. Skipping fetchAffiliateDashboardData.");
           // No es necesario actualizar la UI aquí si el dashboard ya está oculto por Auth.updateAuthStateUI
           return;
       }
       
       // Verificar si los elementos del DOM del dashboard existen
       if (!this.affiliateLinkDisplay || !this.statsTotalSignups || !this.statsTotalOrders || 
           !this.statsPendingCommission || !this.statsPaidCommission || !this.affiliateReferralsList) {
           console.warn("Affiliate.fetchAffiliateDashboardData: Some affiliate dashboard DOM elements are missing. Ensure IDs are correct and elements exist.");
           return;
       }

       // Mostrar placeholders de carga solo si el dashboard es visible (Auth.updateAuthStateUI lo maneja)
       this.affiliateLinkDisplay.textContent = i18n.getTranslation("text_loading", "Loading...");
       this.statsTotalSignups.textContent = '...';
       this.statsTotalOrders.textContent = '...';
       this.statsPendingCommission.textContent = '...';
       this.statsPaidCommission.textContent = '...';
       this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("text_loading_referrals", "Loading referrals...")}</p>`;

       try {
           const [statsResponse, referralsResponse] = await Promise.all([
               fetch(window.API_BASE_URL + '/affiliate/stats', { headers: { 'Authorization': 'Bearer ' + token } }),
               fetch(window.API_BASE_URL + '/affiliate/referrals', { headers: { 'Authorization': 'Bearer ' + token } })
           ]);

           const statsData = statsResponse.ok ? await statsResponse.json() : null;
           const referralsData = referralsResponse.ok ? await referralsResponse.json() : null;

           if (statsData) {
               // Actualizar el Dashboard de Afiliados principal
               this.affiliateLinkDisplay.textContent = statsData.affiliate_link || 'N/A';
               this.statsTotalSignups.textContent = statsData.total_referrals_signed_up !== undefined ? statsData.total_referrals_signed_up : 0;
               this.statsTotalOrders.textContent = statsData.total_referred_orders !== undefined ? statsData.total_referred_orders : 0;
               this.statsPendingCommission.textContent = formatCurrency(statsData.total_commission_pending || 0);
               this.statsPaidCommission.textContent = formatCurrency(statsData.total_commission_paid_or_approved || 0);

                   // Update sidebar profile card using UI.updateDropdownProfileCard
                   if (window.UI && typeof window.UI.updateDropdownProfileCard === 'function') {
                       const cachedProfile = window.Auth && window.Auth.cachedProfile ? window.Auth.cachedProfile : {};
                       const profileDataForCard = {
                           name: cachedProfile.name || 'Usuario', 
                           avatar_url: cachedProfile.avatar_url, 
                           affiliateLink: statsData.affiliate_link || (cachedProfile.affiliateLink || ''), 
                           total_referrals_signed_up: statsData.total_referrals_signed_up !== undefined ? statsData.total_referrals_signed_up : (cachedProfile.total_referrals_signed_up !== undefined ? cachedProfile.total_referrals_signed_up : 0),
                           total_commission_pending: statsData.total_commission_pending !== undefined ? statsData.total_commission_pending : (cachedProfile.total_commission_pending !== undefined ? cachedProfile.total_commission_pending : 0),
                           // Include email if UI.updateDropdownProfileCard uses it and it's in cachedProfile
                           email: cachedProfile.email 
                       };
                       // console.log('Datos para tarjeta de perfil del sidebar (actualizados desde affiliate.js con UI.updateDropdownProfileCard):', profileDataForCard); // Mantener comentado o eliminar
                       window.UI.updateDropdownProfileCard(profileDataForCard);
                   }

               // La siguiente sección para actualizar la tarjeta de perfil del dropdown ha sido eliminada.
               // La información de afiliados para la nueva sección de perfil principal (#user-profile)
               // se actualiza a través de Auth.updateAuthStateUI -> UI.updateUserProfileSection.
               // Si los datos de 'statsData' necesitan refrescar la sección de perfil principal
               // (por ejemplo, si se actualizan más frecuentemente que el login),
               // se debería llamar a UI.updateUserProfileSection(profileConNuevosDatosDeAfiliado) aquí.
               // Por ahora, se asume que UI.updateUserProfileSection ya tiene acceso a los datos más recientes
               // a través de Auth.cachedProfile cuando se actualiza.

           } else {
               // Si statsData falla, limpiar los campos o mostrar error
               this.affiliateLinkDisplay.textContent = i18n.getTranslation("text_error_loading", "Error loading");
               this.statsTotalSignups.textContent = '-';
               this.statsTotalOrders.textContent = '-';
               this.statsPendingCommission.textContent = '-';
               this.statsPaidCommission.textContent = '-';
           }

           // Procesar y mostrar lista de referidos
           this.affiliateReferralsList.innerHTML = ''; 
           if (referralsData && referralsData.length > 0) {
               const ul = document.createElement('ul');
               referralsData.forEach(ref => {
                   const li = document.createElement('li');
                   const orderDate = new Date(ref.order_date).toLocaleDateString(); 
                   li.innerHTML = `Order ID: ${ref.referred_order_id} | Date: ${orderDate} | Total: ${formatCurrency(ref.order_total_amount)} | Commission: ${formatCurrency(ref.commission_earned)} (${(ref.commission_rate_at_referral * 100).toFixed(0)}%) | Status: ${ref.commission_status}`;
                   ul.appendChild(li);
               });
               this.affiliateReferralsList.appendChild(ul);
           } else if (referralsData) { 
               this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("text_no_referrals_yet", "No referrals yet.")}</p>`;
           } else { 
               this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("error_loading_referrals", "Error loading referrals.")}</p>`;
           }
       } catch (error) {
           console.error('Error fetching affiliate dashboard data:', error);
           if(this.affiliateLinkDisplay) this.affiliateLinkDisplay.textContent = i18n.getTranslation("text_error_loading", "Error loading");
           if(this.statsTotalSignups) this.statsTotalSignups.textContent = '-';
           // ... (limpiar otros campos del dashboard) ...
           if(this.affiliateReferralsList) this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("error_loading_referrals", "Error loading referrals.")}</p>`;
       }
   }
};
