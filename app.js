const { createApp } = Vue;

createApp({
    data() {
        return {
        // Authentication
        isAuthenticated: false,
        currentUser: null,
        authToken: null,
        loading: true,
        errorMessage: '',
        authMode: 'login',
            
            // Login/Signup Forms
            loginForm: {
                email: '',
                password: ''
            },
            signupForm: {
                firstName: '',
                lastName: '',
                userName: '',
                email: '',
                birthDate: '',
                password: ''
            },
            
            // Navigation
            currentView: localStorage.getItem('currentView') || 'wallets',
            selectedWallet: null,
            
            // Toast notifications
            toastMessage: '',
            toastType: 'success',
            showToast: false,
            
            // Confirmation modal
            showConfirmModal: false,
            confirmModalTitle: '',
            confirmModalMessage: '',
            confirmModalAction: null,
            
            walletTransactions: [],
            
            // Profile Panel
            showProfilePanel: false,
            profileLoading: false,
            profileForm: {
                firstName: '',
                lastName: '',
                userName: '',
                email: '',
                birthDate: ''
            },
            
            // Transfer Modal
            showTransferModal: false,
            transferForm: {
                sourceWalletId: null,
                destinationWalletId: null,
                amount: 0
            },
            
            // Data
            wallets: [],
            walletFilter: 'active', // 'active' or 'archived'
            transactionFilter: 'all', // 'all' or 'recurring'
            allTransactions: [],
            recentTransactions: [],
            lastTransactions: [],
            categories: [],
            currencies: [],
            goals: [],
            transactionStatistics: null,
            statisticsRequest: {
                startDate: null,
                endDate: null,
                currency: 'USD'
            },
            
            // Statistics
            totalWallets: 0,
            totalBalance: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            
            // Modals
            showCreateWallet: false,
            showCreateTransaction: false,
            showEditWallet: false,
            showCreateGoal: false,
            selectedWallet: null,
            
            // Forms
            newWallet: {
                name: '',
                initialAmount: 0,
                currency: 'USD',
                savings: false
            },
            editWalletForm: {
                id: null,
                name: '',
                currentAmount: 0,
                currency: 'USD',
                savings: false
            },
            newTransaction: {
                name: '',
                amount: 0,
                type: 'EXPENSE',
                walletId: null,
                category: '',
                currency: 'USD',
                recurring: false,
                frequency: null,
                goal: null
            },
            newGoal: {
                name: '',
                walletId: null,
                currentAmount: 0,
                goalAmount: 0,
                targetDate: ''
            },
            
            // Edit Goal Form
            showEditGoal: false,
            editGoalForm: {
                id: null,
                name: '',
                walletId: null,
                currentAmount: 0,
                goalAmount: 0,
                targetDate: ''
            },
            
            // API Configuration
            apiBaseUrl: 'http://localhost:8080/bank/api',
            
            // Admin Data
            adminUsers: [],
            adminDashboard: null,
            adminCategories: [],
            selectedUser: null,
            selectedUserId: null,
            selectedUserStatus: 'ACTIVE',
            adminNote: '',
            adminUserSearch: '',
            newCategory: {
                name: '',
                transactionType: 'EXPENSE'
            },
            newCurrency: {
                name: '',
                exchangeRateToDollar: null
            },
            monitoredTransactions: [],
            monitoringRequest: {
                userId: null,
                category: '',
                amount: null,
                amountGreaterOrEqual: true,
                date: null,
                dateAfterOrEqual: true,
                sortByDate: false,
                sortByAmount: false
            }
        }
    },
    
    watch: {
        currentView(newView) {
            // Save current view to localStorage for persistence on refresh
            localStorage.setItem('currentView', newView);
        }
    },
    
    computed: {
        currentViewTitle() {
            const titles = {
                'wallets': 'My Wallets',
                'transactions': 'Transactions',
                'goals': 'Goals',
                'wallet-detail': 'Wallet Details',
                'admin': 'Admin Panel'
            };
            return titles[this.currentView] || 'Wallettine';
        },
        
        savingsWallets() {
            return this.wallets.filter(wallet => wallet.savings && !wallet.archived);
        },
        
        filteredWallets() {
            if (this.walletFilter === 'archived') {
                return this.wallets.filter(wallet => wallet.archived);
            }
            return this.wallets.filter(wallet => !wallet.archived);
        },
        
        walletGoals() {
            if (!this.newTransaction.walletId) return [];
            return this.goals.filter(goal => goal.walletId === this.newTransaction.walletId);
        },
        
        filteredTransactions() {
            // Use lastTransactions which has recurring field
            const transactions = this.lastTransactions.length > 0 ? this.lastTransactions : this.allTransactions;
            
            if (this.transactionFilter === 'recurring') {
                return transactions.filter(t => t.recurring === true);
            }
            return transactions; // Show all by default
        }
    },
    
    async mounted() {
        // Check if user is already logged in (JWT token in localStorage)
        const token = localStorage.getItem('authToken');
        console.log('Page loaded, checking for token in localStorage:', token ? 'Found' : 'Not found');
        if (token) {
            this.authToken = token;
            console.log('Token set in Vue data:', this.authToken);
            try {
                // Call /auth/me to validate token and get user data
                const response = await this.apiCall('/auth/me', 'GET');
                console.log('/auth/me response:', response);
                if (response.data) {
                    this.currentUser = response.data;
                    this.isAuthenticated = true;
                    await this.loadUserData();
                }
            } catch (error) {
                console.log('Invalid token or error loading user, clearing auth');
                console.error(error);
                this.clearAuth();
            } finally {
                this.loading = false;
            }
        } else {
            this.loading = false;
        }
    },
    
    methods: {
        // Authentication Methods
        async checkAuthentication() {
            // Skip session check on initial load - let backend handle it
            this.loading = false;
            this.isAuthenticated = false;
        },
        
        async login() {
            this.loading = true;
            this.errorMessage = '';
            
            console.log('Attempting login with:', this.loginForm.email);
            
            try {
                // Backend expects JSON body with UserRequest
                const loginData = {
                    email: this.loginForm.email,
                    password: this.loginForm.password
                };
                
                console.log('Sending login request...');
                const response = await this.apiCall('/auth/login', 'POST', loginData);
                console.log('Login response received:', response);
                
                // Extract user data and token from response
                this.currentUser = response.data.user;
                this.authToken = response.data.token;
                
                console.log('Login successful, user data:', this.currentUser);
                console.log('JWT token received:', this.authToken);
                console.log('User role:', this.currentUser.role);
                console.log('Role type:', typeof this.currentUser.role);
                console.log('Role comparison with ADMIN:', this.currentUser.role === 'ADMIN');
                console.log('Role comparison with admin:', this.currentUser.role === 'admin');
                console.log('Role length:', this.currentUser.role?.length);
                console.log('Role char codes:', this.currentUser.role?.split('').map(c => c.charCodeAt(0)));
                console.log('Full user object keys:', Object.keys(this.currentUser));
                
                // Store token in localStorage
                localStorage.setItem('authToken', this.authToken);
                console.log('Token stored in localStorage:', localStorage.getItem('authToken'));
                
                this.isAuthenticated = true;
                this.currentView = 'wallets';
                await this.loadUserData();
                
                // Reset form
                this.loginForm = { email: '', password: '' };
            } catch (error) {
                console.error('Login error:', error);
                console.error('Error response:', error.response);
                this.errorMessage = error.response?.data || error.message || 'Login failed';
            } finally {
                this.loading = false;
            }
        },
        
        async signup() {
            this.loading = true;
            this.errorMessage = '';
            
            try {
                // Convert birthDate to ISO string (Instant format)
                const signupData = {
                    ...this.signupForm,
                    birthDate: new Date(this.signupForm.birthDate).toISOString()
                };
                
                const response = await this.apiCall('/auth/signup', 'POST', signupData);
                
                // Extract user data and token from response
                this.currentUser = response.data.user;
                this.authToken = response.data.token;
                
                console.log('Signup successful, user data:', this.currentUser);
                console.log('JWT token received:', this.authToken);
                
                // Store token in localStorage
                localStorage.setItem('authToken', this.authToken);
                
                this.isAuthenticated = true;
                await this.loadUserData();
                
                // Reset form
                this.signupForm = {
                    firstName: '',
                    lastName: '',
                    userName: '',
                    email: '',
                    birthDate: '',
                    password: ''
                };
            } catch (error) {
                this.errorMessage = error.response?.data || 'Signup failed';
            } finally {
                this.loading = false;
            }
        },
        
        async logout() {
            try {
                await this.apiCall('/auth/logout', 'POST');
            } catch (error) {
                console.log('Logout error:', error);
            } finally {
                this.clearAuth();
            }
        },
        
        clearAuth() {
            this.isAuthenticated = false;
            this.currentUser = null;
            this.authToken = null;
            this.wallets = [];
            this.allTransactions = [];
            this.recentTransactions = [];
            this.goals = [];
            this.currencies = [];
            this.transactionStatistics = null;
            this.resetStats();
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentView');
            this.currentView = 'login';
        },
        
        // Data Loading Methods
        async loadUserData() {
            if (!this.currentUser) {
                console.log('No current user, skipping loadUserData');
                return;
            }
            
            console.log('Loading user data for user:', this.currentUser.id);
            console.log('Auth token present:', !!this.authToken);
            
            try {
                await Promise.all([
                    this.loadWallets(),
                    this.loadTransactions(),
                    this.loadCategories(),
                    this.loadLastTransactions(),
                    this.loadGoals()
                ]);
                this.calculateStats();
                
                // Load currencies (now available to all users)
                await this.loadCurrencies();
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        },
        
        async loadWallets() {
            try {
                console.log('Loading wallets for user:', this.currentUser.id);
                const response = await this.apiCall(`/wallets/${this.currentUser.id}/all`, 'GET');
                this.wallets = response.data || [];
                this.totalWallets = this.wallets.length;
                console.log('Wallets loaded:', this.wallets);
            } catch (error) {
                console.error('Error loading wallets:', error);
                this.wallets = [];
                this.totalWallets = 0;
            }
        },
        
        async loadTransactions() {
            try {
                // Load transactions for all wallets
                const walletTransactions = await Promise.all(
                    this.wallets.map(wallet => 
                        this.apiCall(`/wallets/${wallet.id}/transactions`, 'GET')
                    )
                );
                
                this.allTransactions = walletTransactions
                    .flatMap(response => response.data || [])
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                this.recentTransactions = this.allTransactions.slice(0, 5);
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        },
        
        async loadCategories() {
            try {
                const response = await this.apiCall('/users/categories?onlyMy=true', 'GET');
                this.categories = response.data || [];
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        },
        
        async loadLastTransactions() {
            try {
                console.log('Loading last 10 transactions for user:', this.currentUser.id);
                const response = await this.apiCall(`/transactions/users/${this.currentUser.id}/last`, 'GET');
                this.lastTransactions = response.data || [];
                console.log('Last transactions loaded:', this.lastTransactions);
            } catch (error) {
                console.error('Error loading last transactions:', error);
            }
        },
        
        async loadGoals() {
            try {
                console.log('Loading goals for user:', this.currentUser.id);
                const response = await this.apiCall(`/goals/${this.currentUser.id}/all`, 'GET');
                this.goals = response.data || [];
                console.log('Goals loaded:', this.goals);
            } catch (error) {
                console.error('Error loading goals:', error);
                this.goals = [];
            }
        },
        
        async loadTransactionStatistics() {
            // Toggle: if already showing, hide it
            if (this.transactionStatistics) {
                this.transactionStatistics = null;
                return;
            }
            
            try {
                // Set default date range to last 30 days if not specified
                const endDate = this.statisticsRequest.endDate || new Date().toISOString();
                const startDate = this.statisticsRequest.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                
                const requestData = {
                    userId: this.currentUser.id,
                    startDate: startDate,
                    endDate: endDate,
                    currency: this.statisticsRequest.currency
                };
                
                const response = await this.apiCall('/transactions/statistics', 'POST', requestData);
                this.transactionStatistics = response.data;
                this.showSuccessMessage(`Statistics loaded in ${this.statisticsRequest.currency}`);
            } catch (error) {
                console.error('Error loading transaction statistics:', error);
                this.transactionStatistics = null;
                this.showErrorMessage('Failed to load statistics');
            }
        },
        
        // Wallet Methods
        async createWallet() {
            try {
                const walletData = {
                    name: this.newWallet.name,
                    initialAmount: parseFloat(this.newWallet.initialAmount),
                    currency: this.newWallet.currency,
                    savings: this.newWallet.savings,
                    userId: this.currentUser.id
                };
                
                const response = await this.apiCall('/wallets/create', 'POST', walletData);
                this.wallets.push(response.data);
                this.showCreateWallet = false;
                this.resetNewWallet();
                this.calculateStats();
                this.showSuccessMessage('Wallet created successfully!');
            } catch (error) {
                this.showErrorMessage('Failed to create wallet');
            }
        },
        
        async editWallet(wallet) {
            this.editWalletForm = {
                id: wallet.id,
                name: wallet.name,
                currentAmount: wallet.balance || wallet.currentAmount || 0,
                currency: wallet.currency,
                savings: wallet.savings
            };
            this.showEditWallet = true;
        },
        
        async updateWallet() {
            try {
                const walletData = {
                    name: this.editWalletForm.name,
                    currentAmount: parseFloat(this.editWalletForm.currentAmount),
                    currency: this.editWalletForm.currency,
                    savings: this.editWalletForm.savings
                };
                
                const response = await this.apiCall(`/wallets/${this.editWalletForm.id}/update`, 'PUT', walletData);
                
                // Update wallet in the list
                const index = this.wallets.findIndex(w => w.id === this.editWalletForm.id);
                if (index !== -1) {
                    this.wallets[index] = response.data;
                }
                
                this.showEditWallet = false;
                this.calculateStats();
                this.showSuccessMessage('Wallet updated successfully!');
            } catch (error) {
                this.showErrorMessage('Failed to update wallet');
            }
        },
        
        async archiveWallet(wallet) {
            try {
                const endpoint = wallet.archived ? 'unarchive' : 'archive';
                const response = await this.apiCall(`/wallets/${wallet.id}/${endpoint}`, 'PUT');
                
                // Update wallet in the list
                const index = this.wallets.findIndex(w => w.id === wallet.id);
                if (index !== -1) {
                    this.wallets[index] = response.data;
                }
                
                this.showSuccessMessage(wallet.archived ? 'Wallet unarchived!' : 'Wallet archived!');
            } catch (error) {
                this.showErrorMessage('Failed to archive wallet');
            }
        },
        
        async deleteWallet(wallet) {
            this.confirmModalTitle = 'Delete Wallet';
            this.confirmModalMessage = `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`;
            this.confirmModalAction = async () => {
                try {
                    await this.apiCall(`/wallets/${wallet.id}`, 'DELETE');
                    this.wallets = this.wallets.filter(w => w.id !== wallet.id);
                    this.calculateStats();
                    this.showSuccessMessage('Wallet deleted successfully!');
                } catch (error) {
                    this.showErrorMessage('Failed to delete wallet');
                }
            };
            this.showConfirmModal = true;
        },
        
        async confirmAction() {
            if (this.confirmModalAction) {
                await this.confirmModalAction();
            }
            this.showConfirmModal = false;
            this.confirmModalAction = null;
        },
        
        cancelConfirmModal() {
            this.showConfirmModal = false;
            this.confirmModalAction = null;
        },
        
        async selectWallet(wallet) {
            this.selectedWallet = wallet;
            console.log('Selected wallet:', wallet);
            
            try {
                // Load transactions for this wallet
                const response = await this.apiCall(`/wallets/${wallet.id}/transactions`, 'GET');
                // Sort by date (newest first)
                this.walletTransactions = (response.data || []).sort((a, b) => 
                    new Date(b.date || b.transactionDate) - new Date(a.date || a.transactionDate)
                );
                console.log('Wallet transactions loaded:', this.walletTransactions);
                
                // Show wallet transactions view
                this.currentView = 'wallet-detail';
            } catch (error) {
                console.error('Error loading wallet transactions:', error);
                alert('Failed to load wallet transactions');
            }
        },
        
        // Transaction Methods (moved to line ~1081 with proper currency handling)
        
        async transferFunds(sourceWalletId, destinationWalletId, amount) {
            try {
                const transferData = {
                    sourceWalletId: sourceWalletId,
                    destinationWalletId: destinationWalletId,
                    amount: parseFloat(amount)
                };
                
                await this.apiCall('/transactions/transfer', 'POST', transferData);
                await this.loadWallets();
                this.calculateStats();
            } catch (error) {
                this.errorMessage = error.response?.data || 'Transfer failed';
            }
        },
        
        // Goal Methods
        async createGoal() {
            try {
                const goalData = {
                    name: this.newGoal.name,
                    walletId: this.newGoal.walletId,
                    currentAmount: this.newGoal.currentAmount ? parseFloat(this.newGoal.currentAmount) : 0,
                    goalAmount: parseFloat(this.newGoal.goalAmount),
                    targetDate: new Date(this.newGoal.targetDate).toISOString()
                };
                
                const response = await this.apiCall('/goals/create', 'POST', goalData);
                this.goals.push(response.data);
                this.showCreateGoal = false;
                this.resetNewGoal();
                this.showSuccessMessage('Goal created successfully!');
            } catch (error) {
                this.showErrorMessage('Failed to create goal');
            }
        },
        
        editGoal(goal) {
            this.editGoalForm = {
                id: goal.id,
                name: goal.name,
                walletId: goal.walletId,
                currentAmount: goal.currentAmount || 0,
                goalAmount: goal.goalAmount,
                targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
            };
            this.showEditGoal = true;
        },
        
        async updateGoal() {
            try {
                const goalData = {
                    name: this.editGoalForm.name,
                    walletId: this.editGoalForm.walletId,
                    currentAmount: this.editGoalForm.currentAmount ? parseFloat(this.editGoalForm.currentAmount) : 0,
                    goalAmount: parseFloat(this.editGoalForm.goalAmount),
                    targetDate: new Date(this.editGoalForm.targetDate).toISOString()
                };
                
                const response = await this.apiCall(`/goals/${this.editGoalForm.id}/update`, 'PUT', goalData);
                
                // Update goal in the list
                const index = this.goals.findIndex(g => g.id === this.editGoalForm.id);
                if (index !== -1) {
                    this.goals[index] = response.data;
                }
                
                this.showEditGoal = false;
                this.showSuccessMessage('Goal updated successfully!');
            } catch (error) {
                this.showErrorMessage('Failed to update goal');
            }
        },
        
        async deleteGoal(goalId) {
            const goal = this.goals.find(g => g.id === goalId);
            const goalName = goal ? goal.name : 'this goal';
            
            this.confirmModalTitle = 'Delete Goal';
            this.confirmModalMessage = `Are you sure you want to delete "${goalName}"? This action cannot be undone.`;
            this.confirmModalAction = async () => {
                try {
                    await this.apiCall(`/goals/${goalId}`, 'DELETE');
                    this.goals = this.goals.filter(g => g.id !== goalId);
                    this.showSuccessMessage('Goal deleted successfully!');
                } catch (error) {
                    this.showErrorMessage('Failed to delete goal');
                }
            };
            this.showConfirmModal = true;
        },
        
        // Admin Methods
        async loadAdminDashboard() {
            console.log('Loading admin dashboard...');
            console.log('Current user:', this.currentUser);
            console.log('Is authenticated:', this.isAuthenticated);
            
            try {
                const response = await this.apiCall('/admin/dashboard', 'GET');
                this.adminDashboard = response.data;
                this.showSuccessMessage('Dashboard loaded successfully');
            } catch (error) {
                console.error('Admin dashboard error:', error);
                this.showErrorMessage('Failed to load dashboard: ' + (error.response?.data || error.message));
            }
        },
        
        async getUserById() {
            if (!this.adminUserSearch) {
                this.showErrorMessage('Please enter a user ID');
                return;
            }
            
            try {
                const response = await this.apiCall(`/users/${this.adminUserSearch}`, 'GET');
                this.selectedUser = response.data;
                this.selectedUserId = response.data.id;
                this.selectedUserStatus = response.data.blocked ? 'BLOCKED' : 'ACTIVE';
                this.showSuccessMessage('User loaded successfully');
            } catch (error) {
                this.showErrorMessage('Failed to load user: ' + (error.response?.data || error.message));
            }
        },
        
        async changeUserStatus() {
            if (!this.selectedUserId) {
                this.showErrorMessage('Please select a user first');
                return;
            }
            
            try {
                const response = await this.apiCall(`/admin/users/${this.selectedUserId}/status?status=${this.selectedUserStatus}`, 'PUT');
                this.showSuccessMessage(response.data);
                // Refresh user data
                await this.getUserById();
            } catch (error) {
                this.showErrorMessage('Failed to change user status: ' + (error.response?.data || error.message));
            }
        },
        
        async addAdminNote() {
            if (!this.selectedUserId || !this.adminNote.trim()) {
                this.showErrorMessage('Please select a user and enter a note');
                return;
            }
            
            try {
                const response = await this.apiCall(`/admin/users/${this.selectedUserId}/note?note=${encodeURIComponent(this.adminNote)}`, 'PUT');
                this.showSuccessMessage(response.data);
                this.adminNote = '';
                // Refresh user data
                await this.getUserById();
            } catch (error) {
                this.showErrorMessage('Failed to add admin note: ' + (error.response?.data || error.message));
            }
        },
        
        async deleteAdminNote() {
            if (!this.selectedUserId) {
                this.showErrorMessage('Please select a user first');
                return;
            }
            
            this.confirmModalTitle = 'Delete Admin Note';
            this.confirmModalMessage = 'Are you sure you want to delete this admin note? This action cannot be undone.';
            this.confirmModalAction = async () => {
                try {
                    const response = await this.apiCall(`/admin/users/${this.selectedUserId}/note`, 'DELETE');
                    this.showSuccessMessage('Admin note deleted successfully!');
                    // Refresh user data
                    await this.getUserById();
                } catch (error) {
                    this.showErrorMessage('Failed to delete admin note: ' + (error.response?.data || error.message));
                }
            };
            this.showConfirmModal = true;
        },
        
        async getUserTransactions() {
            if (!this.selectedUserId) {
                this.showErrorMessage('Please select a user first');
                return;
            }
            
            try {
                const response = await this.apiCall(`/admin/users/${this.selectedUserId}/transactions`, 'GET');
                this.monitoredTransactions = response.data;
                this.showSuccessMessage('User transactions loaded successfully');
            } catch (error) {
                this.showErrorMessage('Failed to load user transactions: ' + (error.response?.data || error.message));
            }
        },
        
        async loadAdminCategories() {
            try {
                const response = await this.apiCall('/admin/categories', 'GET');
                this.adminCategories = response.data;
                this.showSuccessMessage('Categories loaded successfully');
            } catch (error) {
                this.showErrorMessage('Failed to load categories: ' + (error.response?.data || error.message));
            }
        },
        
        async createCategory() {
            if (!this.newCategory.name.trim()) {
                this.showErrorMessage('Please enter a category name');
                return;
            }
            
            try {
                const response = await this.apiCall('/admin/categories', 'POST', this.newCategory);
                this.adminCategories.push(response.data);
                this.newCategory = { name: '', transactionType: 'EXPENSE' };
                this.showSuccessMessage('Category created successfully');
            } catch (error) {
                this.showErrorMessage('Failed to create category: ' + (error.response?.data || error.message));
            }
        },
        
        async deleteCategory(categoryId) {
            const category = this.adminCategories.find(c => c.id === categoryId);
            const categoryName = category ? category.name : 'this category';
            
            this.confirmModalTitle = 'Delete Category';
            this.confirmModalMessage = `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`;
            this.confirmModalAction = async () => {
                try {
                    await this.apiCall(`/admin/categories/${categoryId}`, 'DELETE');
                    this.adminCategories = this.adminCategories.filter(c => c.id !== categoryId);
                    this.showSuccessMessage('Category deleted successfully!');
                } catch (error) {
                    this.showErrorMessage('Failed to delete category');
                }
            };
            this.showConfirmModal = true;
        },
        
        async loadCurrencies() {
            try {
                const response = await this.apiCall('/admin/currencies/all', 'GET');
                this.currencies = response.data;
                console.log('Currencies loaded:', this.currencies);
            } catch (error) {
                console.error('Failed to load currencies:', error);
                // Fallback to empty array if loading fails
                this.currencies = [];
            }
        },
        
        async createCurrency() {
            if (!this.newCurrency.name.trim() || !this.newCurrency.exchangeRateToDollar) {
                this.showErrorMessage('Please enter both currency name and exchange rate');
                return;
            }
            
            try {
                const response = await this.apiCall('/admin/currencies', 'POST', this.newCurrency);
                this.currencies.push(response.data);
                this.newCurrency = { name: '', exchangeRateToDollar: null };
                this.showSuccessMessage('Currency created successfully');
            } catch (error) {
                this.showErrorMessage('Failed to create currency: ' + (error.response?.data || error.message));
            }
        },
        
        async deleteCurrency(currencyId) {
            const currency = this.currencies.find(c => c.id === currencyId);
            const currencyName = currency ? currency.name : 'this currency';
            
            this.confirmModalTitle = 'Delete Currency';
            this.confirmModalMessage = `Are you sure you want to delete "${currencyName}"? This action cannot be undone.`;
            this.confirmModalAction = async () => {
                try {
                    await this.apiCall(`/admin/currencies/${currencyId}/delete`, 'DELETE');
                    this.currencies = this.currencies.filter(c => c.id !== currencyId);
                    this.showSuccessMessage('Currency deleted successfully!');
                } catch (error) {
                    this.showErrorMessage('Failed to delete currency');
                }
            };
            this.showConfirmModal = true;
        },
        
        async monitorTransactions() {
            console.log('Monitor button clicked');
            console.log('Monitoring request data:', this.monitoringRequest);
            
            // Build the request with only non-null/non-empty values
            const request = {};
            
            if (this.monitoringRequest.userId) request.userId = this.monitoringRequest.userId;
            if (this.monitoringRequest.category && this.monitoringRequest.category.trim()) {
                request.category = this.monitoringRequest.category.trim();
            }
            if (this.monitoringRequest.amount) {
                request.amount = this.monitoringRequest.amount;
                request.amountGreaterOrEqual = this.monitoringRequest.amountGreaterOrEqual;
            }
            if (this.monitoringRequest.date) {
                // Convert datetime-local to ISO string
                request.date = new Date(this.monitoringRequest.date).toISOString();
                request.dateAfterOrEqual = this.monitoringRequest.dateAfterOrEqual;
            }
            request.sortByDate = this.monitoringRequest.sortByDate;
            request.sortByAmount = this.monitoringRequest.sortByAmount;
            
            console.log('Sending request:', request);
            
            try {
                // Use POST instead of GET since GET with body is problematic
                const response = await this.apiCall('/admin/monitor', 'POST', request);
                console.log('Monitor response:', response);
                this.monitoredTransactions = response.data || [];
                console.log('Monitored transactions count:', this.monitoredTransactions.length);
                this.showSuccessMessage(`Found ${this.monitoredTransactions.length} transactions`);
            } catch (error) {
                console.error('Monitor error:', error);
                console.error('Error response:', error.response);
                this.showErrorMessage('Failed to monitor transactions: ' + (error.response?.data || error.message));
                this.monitoredTransactions = [];
            }
        },
        
        showSuccessMessage(message) {
            this.showToastNotification(message, 'success');
        },
        
        showErrorMessage(message) {
            this.showToastNotification(message, 'error');
        },
        
        showToastNotification(message, type = 'success') {
            this.toastMessage = message;
            this.toastType = type;
            this.showToast = true;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                this.showToast = false;
            }, 3000);
        },
        
        // Statistics Methods
        calculateStats() {
            console.log('Calculating stats...');
            console.log('Wallets:', this.wallets);
            console.log('Transactions:', this.allTransactions);
            
            this.totalWallets = this.wallets.length;
            this.totalBalance = this.wallets.reduce((sum, wallet) => {
                const balance = parseFloat(wallet.balance || wallet.currentAmount || 0);
                console.log(`Wallet ${wallet.name} balance:`, balance);
                return sum + balance;
            }, 0);
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const monthlyTransactions = this.allTransactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            });
            
            this.monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            this.monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            console.log('Stats calculated:', {
                totalWallets: this.totalWallets,
                totalBalance: this.totalBalance,
                monthlyIncome: this.monthlyIncome,
                monthlyExpenses: this.monthlyExpenses
            });
        },
        
        resetStats() {
            this.totalWallets = 0;
            this.totalBalance = 0;
            this.monthlyIncome = 0;
            this.monthlyExpenses = 0;
        },
        
        // Utility Methods
        async apiCall(endpoint, method = 'GET', data = null) {
            const url = `${this.apiBaseUrl}${endpoint}`;
            const config = {
                method,
                url,
                headers: {}
            };
            
            // Add JWT token to Authorization header if available
            if (this.authToken) {
                config.headers['Authorization'] = `Bearer ${this.authToken}`;
                console.log('Authorization header set:', config.headers['Authorization']);
            } else {
                console.log('No auth token available for this request');
            }
            
            if (data) {
                if (data instanceof FormData) {
                    config.data = data;
                    // Don't set Content-Type for FormData, let browser set it with boundary
                    delete config.headers['Content-Type'];
                } else {
                    config.data = data;
                    config.headers['Content-Type'] = 'application/json';
                }
            }
            
            // Debug logging
            console.log(`API Call: ${method} ${url}`);
            console.log('Auth token:', this.authToken ? 'Present' : 'Missing');
            if (this.authToken) {
                console.log('Token preview:', this.authToken.substring(0, 20) + '...');
            }
            console.log('Config:', config);
            console.log('Config.data:', JSON.stringify(config.data, null, 2));
            
            try {
                const response = await axios(config);
                console.log(`API Response:`, response.data);
                return response;
            } catch (error) {
                console.error('API Error:', error);
                console.error('Error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url,
                    method: error.config?.method
                });
                
                // If we get 401, the token might be invalid
                if (error.response?.status === 401) {
                    console.log('Token might be invalid, clearing auth');
                    this.clearAuth();
                }
                
                throw error;
            }
        },
        
        formatCurrency(amount, currency = 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2
            }).format(amount);
        },
        
        getWalletCurrency(walletId) {
            const wallet = this.wallets.find(w => w.id === walletId);
            return wallet ? wallet.currency : 'USD';
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },
        
        getTransactionIcon(type) {
            if (type === 'INCOME') return 'fas fa-arrow-up';
            if (type === 'TRANSFER') return 'fas fa-arrow-right';
            return 'fas fa-arrow-down'; // EXPENSE
        },
        
        getGoalProgress(goal) {
            if (!goal || !goal.percentReached) return 0;
            // Backend already calculates percentage, just return it
            return Math.min(parseFloat(goal.percentReached), 100);
        },
        
        resetNewWallet() {
            this.newWallet = {
                name: '',
                initialAmount: 0,
                currency: 'USD',
                savings: false
            };
        },
        
        resetNewTransaction() {
            this.newTransaction = {
                name: '',
                amount: 0,
                type: 'EXPENSE',
                walletId: null,
                category: ''
            };
        },
        
        resetNewGoal() {
            this.newGoal = {
                name: '',
                walletId: null,
                currentAmount: 0,
                goalAmount: 0,
                targetDate: ''
            };
        },
        
        resetNewTransaction() {
            this.newTransaction = {
                name: '',
                amount: 0,
                type: 'EXPENSE',
                walletId: null,
                category: '',
                currency: 'USD',
                recurring: false,
                frequency: null,
                goal: null
            };
        },
        
        // Navigation Methods
        navigateTo(view) {
            this.currentView = view;
            localStorage.setItem('currentView', view);
        },
        
        toggleAdminPanel() {
            console.log('Admin button clicked!');
            this.currentView = this.currentView === 'admin' ? 'wallets' : 'admin';
        },
        
        toggleProfilePanel() {
            if (!this.isAuthenticated || !this.currentUser) {
                console.log('User not authenticated or no current user');
                return;
            }
            
            // Populate form with current user data
            this.profileForm = {
                firstName: this.currentUser.firstName || '',
                lastName: this.currentUser.lastName || '',
                userName: this.currentUser.userName || '',
                email: this.currentUser.email || '',
                birthDate: this.currentUser.birthDate || ''
            };
            
            this.showProfilePanel = !this.showProfilePanel;
        },
        
        async updateProfile() {
            this.profileLoading = true;
            try {
                const response = await this.apiCall(`/users/${this.currentUser.id}/update`, 'PUT', this.profileForm);
                
                // Update current user data
                this.currentUser = { ...this.currentUser, ...response.data };
                
                // Close profile panel
                this.showProfilePanel = false;
                
                this.showSuccessMessage('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                this.showErrorMessage('Failed to update profile');
            } finally {
                this.profileLoading = false;
            }
        },
        
        async disableRecurring(transactionId) {
            try {
                await this.apiCall(`/transactions/${transactionId}/disableRecurring`, 'PUT');
                
                // Update the transaction in lastTransactions
                const transaction = this.lastTransactions.find(t => t.id === transactionId);
                if (transaction) {
                    transaction.recurring = false;
                    transaction.frequency = null;
                }
                
                // Also update in allTransactions if it exists there
                const allTransaction = this.allTransactions.find(t => t.id === transactionId);
                if (allTransaction) {
                    allTransaction.recurring = false;
                    allTransaction.frequency = null;
                }
                
                this.showSuccessMessage('Recurring disabled successfully!');
            } catch (error) {
                console.error('Error disabling recurring:', error);
                this.showErrorMessage('Failed to disable recurring');
            }
        },
        
        async transferFunds() {
            try {
                const transferData = {
                    sourceWalletId: this.transferForm.sourceWalletId,
                    destinationWalletId: this.transferForm.destinationWalletId,
                    amount: this.transferForm.amount
                };
                
                console.log('Transferring funds:', transferData);
                const response = await this.apiCall('/transactions/transfer', 'POST', transferData);
                console.log('Transfer successful:', response.data);
                
                // Close transfer modal
                this.showTransferModal = false;
                
                // Reset form
                this.transferForm = {
                    sourceWalletId: null,
                    destinationWalletId: null,
                    amount: 0
                };
                
                // Show success message
                this.showSuccessMessage('Transfer completed successfully!');
                
                // Reload wallets and transactions in background
                Promise.all([
                    this.loadWallets(),
                    this.selectedWallet ? this.selectWallet(this.selectedWallet) : Promise.resolve()
                ]).catch(err => console.error('Error reloading data:', err));
                
            } catch (error) {
                console.error('Error transferring funds:', error);
                this.showErrorMessage('Failed to transfer funds. Please try again.');
            }
        },
        
        async createTransaction() {
            try {
                // Find the selected wallet
                const selectedWallet = this.wallets.find(w => w.id === this.newTransaction.walletId);
                
                if (!selectedWallet) {
                    this.showErrorMessage('Please select a wallet');
                    return;
                }
                
                const transactionData = {
                    name: this.newTransaction.name,
                    currency: this.newTransaction.currency,
                    amount: parseFloat(this.newTransaction.amount),
                    category: this.newTransaction.category,
                    type: this.newTransaction.type,
                    transactionDate: new Date().toISOString(),
                    walletId: this.newTransaction.walletId,
                    recurring: this.newTransaction.recurring,
                    frequency: this.newTransaction.recurring ? this.newTransaction.frequency : null,
                    goal: this.newTransaction.goal || null
                };
                
                await this.apiCall('/transactions/make', 'POST', transactionData);
                
                // Close modal and reset form immediately
                this.showCreateTransaction = false;
                this.resetNewTransaction();
                
                // Show success message first
                this.showSuccessMessage('Transaction created successfully!');
                
                // Reload data in background (don't await to avoid blocking UI)
                setTimeout(() => {
                    Promise.all([
                        this.loadWallets(),
                        this.loadTransactions(),
                        this.loadLastTransactions(),
                        this.loadGoals()
                    ]).catch(err => console.error('Error reloading data:', err));
                    
                    if (this.selectedWallet) {
                        this.loadWalletTransactions(this.selectedWallet.id).catch(err => 
                            console.error('Error reloading wallet transactions:', err)
                        );
                    }
                }, 100);
            } catch (error) {
                console.error('Error creating transaction:', error);
                console.error('Error details:', error.response?.data || error.message);
                this.showErrorMessage('Failed to create transaction');
            }
        },
        
        openCreateTransaction() {
            // Pre-select the current wallet if we're in wallet detail view
            if (this.selectedWallet) {
                this.newTransaction.walletId = this.selectedWallet.id;
            }
            this.showCreateTransaction = true;
        },
        
        openTransferModal() {
            // Pre-select the source wallet if we're in wallet detail view
            if (this.selectedWallet) {
                this.transferForm.sourceWalletId = this.selectedWallet.id;
            }
            this.showTransferModal = true;
        },
        
        isAdmin() {
            if (!this.currentUser || !this.currentUser.role) {
                return false;
            }
            const role = this.currentUser.role.toString().trim().toUpperCase();
            console.log('Checking admin role:', role);
            return role === 'ADMIN';
        }
    }
}).mount('#app');
