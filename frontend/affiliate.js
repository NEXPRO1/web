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

               // Preparar datos y actualizar la tarjeta de perfil del sidebar
               // Asumimos que la tarjeta de perfil en el sidebar debe reflejar estos mismos datos de 'stats'
               // para los campos de afiliados, complementados con el perfil general para nombre/avatar.
               if (window.UI && typeof window.UI.updateDropdownProfileCard === 'function') {
                   const cachedProfile = window.Auth && window.Auth.cachedProfile ? window.Auth.cachedProfile : {};
                   const profileDataForCard = {
                       name: cachedProfile.name || 'Usuario', 
                       avatar_url: cachedProfile.avatar_url, // Este DEBE venir de /api/auth/profile via Auth.cachedProfile
                       affiliateLink: statsData.affiliate_link || cachedProfile.affiliateLink || '', 
                       total_referrals_signed_up: statsData.total_referrals_signed_up || 0,
                       total_commission_pending: statsData.total_commission_pending || 0
                   };
                   // console.log('Datos para tarjeta de perfil (actualizados desde affiliate.js):', profileDataForCard);
                   window.UI.updateDropdownProfileCard(profileDataForCard);
               }
           } else {
               // Si statsData falla, limpiar los campos o mostrar error
               this.affiliateLinkDisplay.textContent = i18n.getTranslation("text_error_loading", "Error loading");
               this.statsTotalSignups.textContent = '-';
               this.statsTotalOrders.textContent = '-';
               this.statsPendingCommission.textContent = '-';
               this.statsPaidCommission.textContent = '-';
               // También podrías querer limpiar la tarjeta del sidebar o mostrar un error allí si esta fuente es crítica para ella
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
           // Considerar no llamar a updateDropdownProfileCard o llamarlo con datos de error/vacíos
       }
   }
};
