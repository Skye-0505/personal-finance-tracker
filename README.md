# Personal Finance Tracker
A full-stack project for personal bookkeeping and expense analysis, supporting user registration and login, income/expense record management, category management, visual analytics, and AI-powered spending suggestions.

## Project Introduction
`Personal Finance Tracker` is a full-stack personal finance management system with a separated frontend and backend. Its core goal is to help users complete the following workflows:

- Record income and expenses (by date, category, description, and amount)
- Manage accounts by category and maintain custom categories
- View visual trends on the dashboard and analytics center
- Analyze transaction behavior from the past 30 days (falling back to full data if none) via AI and receive recommendations
- Manage username, password, and account status in the profile center

The project uses JWT authentication. All business APIs isolate data by user, ensuring each user can only access their own transactions and category data.

## Tech Stack
### Frontend
- `Vue 3`
- `Vite`
- `Vue Router`
- `Bootstrap 5` + `Bootstrap Icons`
- `Chart.js`
- `ECharts`
- `Pinia`

### Backend
- `Node.js`
- `Express`
- `Mongoose`
- `JWT` (`jsonwebtoken`)
- `bcrypt`
- `cors` / `dotenv` / `axios`

### Database
- `MongoDB`

## Modules & Features
### 1) Authentication Module
- User registration: creates an account and automatically initializes default categories for the user
- User login: returns `token + user` information
- API authentication based on `Authorization: Bearer <token>`

### 2) Income & Expense Management Module
- CRUD operations for transaction records (create / list / detail / update / delete)
- Filtering by type, category, start date, and end date
- Mobile card view and desktop table view support

### 3) Category Management Module
- Category CRUD (default and custom categories)
- Supports category icons, colors, and income/expense types
- Validation before category deletion

### 4) Dashboard Module
- Statistics for total income, total expense, balance, and transaction count
- Expense category distribution chart (pie chart)
- Income and expense trend chart for the past 6 months (line chart)
- Recent transaction list + quick access links

### 5) Analytics Center Module
- Annual spending heatmap
- Period comparison (current month vs last month / current quarter vs last quarter / current year vs last year)
- Weekly spending pattern analysis
- AI report generation (text suggestions)

### 6) Profile Module
- View and update username
- Change password
- Account deactivation (admin accounts cannot be deactivated)

## Quick Start
### Environment Requirements
- `Node.js >= 18` (LTS version recommended)
- `MongoDB` (local or cloud)
- `npm`

### 1) Configure Backend Environment Variables
At minimum, configure the following variables in `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/personal_finance_tracker
JWT_SECRET=replace_with_your_secret

# AI Analysis
AI_API_KEY=your_api_key
AI_BASE_URL=your_ai_base_url
AI_MODEL_NAME=your_model_name
AI_API_VERSION=2024-02-15-preview
```

### 2) Start Backend
```bash
cd backend
npm install
npm run dev
```

Default backend URL: `http://localhost:3000`

### 3) Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

### 4) Data Initialization (automatic, no manual action needed)
After the backend starts, the project automatically attempts database initialization (creating collections, admin account, and admin default categories).

## Project Structure
```text
personal-finance-tracker/
├── backend/
│   ├── app.js                     # Express entry, mounts routes and middleware
│   ├── bin/www                    # Startup script (default port 3000)
│   ├── config/
│   │   └── database.js            # MongoDB connection
│   ├── controllers/               # Controller layer
│   ├── middlewares/
│   │   └── auth.js                # JWT authentication middleware
│   ├── models/                    # Mongoose models
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Category.js
│   ├── routes/                    # API routes
│   │   ├── index.js               # /api/init
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   └── ai.js
│   ├── seed/
│   │   ├── defaultCategories.js   # Default category definitions
│   │   └── initCategories.js      # Initialization script
│   ├── services/                  # Business service layer
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                   # Frontend API wrappers
│   │   ├── components/            # Shared components (e.g. NavBar)
│   │   ├── router/
│   │   │   └── index.js           # Routes + login guard
│   │   ├── views/                 # Pages
│   │   │   ├── Login.vue / Register.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── Analytics.vue
│   │   │   ├── Transactions.vue
│   │   │   ├── Categories.vue
│   │   │   ├── CategoryDetail.vue
│   │   │   └── Profile.vue
│   │   └── main.js
│   ├── vite.config.js
│   └── package.json
├── DEFAULT_CATEGORIES.md          # Predefined category documentation
└── README.md
```

## Database Design
Built on MongoDB + Mongoose, with three core collections:

### `users`
| Field | Type | Description |
|---|---|---|
| `username` | String | Unique username |
| `password_hash` | String | Hashed password |
| `is_active` | Boolean | Whether the account is active |
| `created_at` | Date | Creation time |
| `updated_at` | Date | Update time |

### `categories`
| Field | Type | Description |
|---|---|---|
| `user_id` | ObjectId | Belongs to user |
| `name` | String | Category name |
| `type` | String | `income` / `expense` |
| `icon` | String | Bootstrap Icon class name |
| `color` | String | Category color |
| `isDefault` | Boolean | Whether it is a default category |
| `created_at` | Date | Creation time |
| `updated_at` | Date | Update time |

### `transactions`
| Field | Type | Description |
|---|---|---|
| `user_id` | ObjectId | Belongs to user |
| `type` | String | `income` / `expense` |
| `amount` | Number | Amount, `> 0` |
| `category` | String | Category name (string) |
| `description` | String | Description |
| `transaction_date` | Date | Transaction date |
| `created_at` | Date | Creation time |
| `updated_at` | Date | Update time |

### Relationship Notes
- `users (1) -> (N) categories`
- `users (1) -> (N) transactions`
- `transactions.category` stores the category name as a string (not a foreign key)

## API Documentation
Base URL: `http://localhost:3000/api`

### Authentication
- Include in request headers after login: `Authorization: Bearer <token>`
- All business APIs require authentication except `/auth/*` and `/init`

### 1) System Initialization
- `POST /init`: Initializes collections, admin account, and admin default categories

### 2) Authentication APIs
- `POST /auth/register`: User registration
- `POST /auth/login`: User login

### 3) User APIs
- `GET /users/profile`: Get personal information
- `PUT /users/profile`: Update username
- `PUT /users/password`: Change password
- `DELETE /users/account`: Deactivate account

### 4) Transaction APIs
- `GET /transactions`: List transactions (supports query params: `type`, `category`, `startDate`, `endDate`)
- `GET /transactions/:id`: Transaction details
- `POST /transactions`: Create transaction
- `PUT /transactions/:id`: Update transaction
- `DELETE /transactions/:id`: Delete transaction

### 5) Category APIs
- `POST /categories/init`: Initialize default categories for current user
- `GET /categories`: List categories
- `GET /categories/:id`: Category details
- `POST /categories`: Create category
- `PUT /categories/:id`: Update category
- `DELETE /categories/:id`: Delete category

### 6) AI APIs
- `POST /ai/analyze`: Generate AI spending analysis

## Predefined Category List
The system includes **25 built-in categories** (18 expense + 7 income), automatically initialized for new users upon registration.

### Expense Categories (18)
- Food
- Transportation
- Shopping
- Entertainment
- Housing
- Utilities
- Communication
- Healthcare
- Education
- Travel
- Social
- Fitness
- Pets
- Clothing
- Beauty
- Electronics
- Home
- Other

### Income Categories (7)
- Salary
- Bonus
- Investment
- Gift
- Refund
- Reimbursement
- Other Income

## Usage Instructions
### Recommended First-Time Workflow
1. Register and log in
2. Go to `Transactions` to add several income/expense records
3. Go to `Categories` to review default categories and add custom ones as needed
4. View overview and charts on the `Dashboard`
5. Generate detailed analysis and AI reports in `Analytics`
6. Manage username, password, and account status in `Profile`

### Common Notes
- If the AI analysis API fails, first verify that backend AI environment variables are correctly configured
- Ensure no related transactions exist before deleting a category
- Token is stored in browser `localStorage/sessionStorage` and cleared on logout