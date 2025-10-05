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
        }
    }
}).mount('#app');
