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
        // Ensure elements are initialized before trying to access classList or textContent
        if (!this.affiliateDashboardSection) {
            // If called before init (e.g. from Auth.fetchProfile before main.js fully inits modules)
            // console.warn("Affiliate elements not initialized yet. Skipping fetch.");
            return;
        }

        if (!token || this.affiliateDashboardSection.classList.contains('hidden')) {
            // console.log("No token or affiliate dashboard is hidden. Skipping fetch.");
            return;
        }
        
        // Check if elements are available (they are selected in initAffiliateElements)
        if (!this.affiliateLinkDisplay || !this.statsTotalSignups || !this.statsTotalOrders || !this.statsPendingCommission || !this.statsPaidCommission || !this.affiliateReferralsList) {
            console.warn("Some affiliate dashboard DOM elements are missing. Ensure IDs are correct and elements exist.");
            return;
        }

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
                this.affiliateLinkDisplay.textContent = statsData.affiliate_link || 'N/A';
                this.statsTotalSignups.textContent = statsData.total_referrals_signed_up || 0;
                this.statsTotalOrders.textContent = statsData.total_referred_orders || 0;
                this.statsPendingCommission.textContent = formatCurrency(statsData.total_commission_pending || 0);
                this.statsPaidCommission.textContent = formatCurrency(statsData.total_commission_paid_or_approved || 0);
            } else {
                this.affiliateLinkDisplay.textContent = i18n.getTranslation("text_error_loading", "Error loading");
            }

            this.affiliateReferralsList.innerHTML = ''; // Clear loading message
            if (referralsData && referralsData.length > 0) {
                const ul = document.createElement('ul');
                referralsData.forEach(ref => {
                    const li = document.createElement('li');
                    const orderDate = new Date(ref.order_date).toLocaleDateString(); // Consider locale for date formatting
                    li.innerHTML = `Order ID: ${ref.referred_order_id} | Date: ${orderDate} | Total: ${formatCurrency(ref.order_total_amount)} | Commission: ${formatCurrency(ref.commission_earned)} (${(ref.commission_rate_at_referral * 100).toFixed(0)}%) | Status: ${ref.commission_status}`;
                    ul.appendChild(li);
                });
                this.affiliateReferralsList.appendChild(ul);
            } else if (referralsData) { // Empty array
                this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("text_no_referrals_yet", "No referrals yet.")}</p>`;
            } else { // Error loading referrals
                this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("error_loading_referrals", "Error loading referrals.")}</p>`;
            }
        } catch (error) {
            console.error('Error fetching affiliate dashboard data:', error);
            if(this.affiliateLinkDisplay) this.affiliateLinkDisplay.textContent = i18n.getTranslation("text_error_loading", "Error loading");
            if(this.affiliateReferralsList) this.affiliateReferralsList.innerHTML = `<p>${i18n.getTranslation("error_loading_referrals", "Error loading referrals.")}</p>`;
        }
    }
};
