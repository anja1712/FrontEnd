# Wallettine - Money Tracker Frontend

### 
- Backend base path `http://localhost:8080/bank/api/`

### To run frontend
1. Start Db container in Docker
2. Start backend app on localhost:8080 
3. Navigate to your frontend project folder: naprimer  cd "/Users/user/Desktop/project/FE v1"
2. Start the server in terminal: python3 -m http.server 5500 (make sure python installed on pc)
3. To stop frontend, Ctrl+C in the same terminal

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout

### Admin
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/categories` - Get all categories
- `POST /admin/categories` - Create category
- `DELETE /admin/categories/{id}` - Delete category
- `GET /admin/currencies/all` - Get all currencies
- `POST /admin/currencies` - Create currency
- `DELETE /admin/currencies/{id}/delete` - Delete currency
- `POST /admin/monitor` - Monitor transactions
- `PUT /admin/users/{id}/note` - Add admin note
- `DELETE /admin/users/{id}/note` - Delete admin note
- `PUT /admin/users/{id}/status` - Change user status
- `GET /admin/users/{id}/transactions` - Get transactions for user

### Users
- `POST /users/create` - Create user
- `GET /users/{id}` - Get user details
- `GET /users/count` - Get user count
- `PUT /users/{id}/update` - Update user
- `POST /users/categories/add` - Add category
- `GET /users/categories` - Get user categories

### Wallets
- `POST /wallets/create` - Create wallet
- `GET /wallets/{userId}/all` - Get user wallets
- `GET /wallets/{id}` - Get wallet details
- `PUT /wallets/{id}/update` - Update wallet
- `PUT /wallets/{id}/archive` - Archive wallet
- `PUT /wallets/{id}/unarchive` - Unarchive wallet
- `DELETE /wallets/{id}` - Delete wallet
- `GET /wallets/{id}/transactions` - Get wallet transactions

### Transactions
- `POST /transactions/make` - Create transaction
- `GET /transactions/grouped` - Get grouped transactions
- `POST /transactions/transfer` - Transfer funds
- `GET /transactions/statistics` - Get transaction statistics
- `PUT /transactions/{id}/disableRecurring` - Disable recurring for transaction
- `GET /transactions/users/{userId}/last` - Get last 20 user transactions
- `GET /transactions/wallets/{walletId}` - Get transactions for wallet


### Goals
- `POST /goals/create` - Create goal
- `PUT /goals/update` - Update goal
- `GET /goals/all` - Get goals for user
- `DELETE /goals/{id}` - Delete goal