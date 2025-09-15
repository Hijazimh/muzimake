# Muzimake Admin Dashboard Setup

## 🚀 Quick Start

### 1. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `database/database-setup.sql`
4. This will create the `song_requests` table with sample data

### 2. Access the Admin Dashboard
1. Start the local server: `python3 -m http.server 8001`
2. Open your browser to `http://localhost:8001`
3. Click "Admin Login" in the footer
4. Use these credentials:
   - **Email**: `admin@muzimake.com`
   - **Password**: `admin123`

### 3. Testing the System
1. **Submit a Test Order**:
   - Go to the homepage
   - Click "Create your song"
   - Fill out the 3-step form
   - Complete the order

2. **View in Dashboard**:
   - Login to admin dashboard
   - See the new order appear in the list
   - Update order status (pending → processing → completed)

3. **Test with Sample Data**:
   - The database setup includes 3 sample orders
   - Use the "Create Test Order" button (red button in bottom-right) for quick testing

## 📊 Dashboard Features

### Statistics Cards
- **Total Orders**: Count of all submitted orders
- **Pending**: Orders waiting to be processed
- **Completed**: Finished orders
- **Revenue**: Total revenue from completed orders

### Order Management
- **View Orders**: See all submitted song requests
- **Filter by Status**: Filter orders by pending, processing, completed, or cancelled
- **Update Status**: Change order status with one click
- **View Details**: See complete customer and song information

### Order Information Displayed
- Customer name and email
- Phone number
- Song celebration type
- Music genre
- Recipient details
- Order status and date
- Pricing information

## 🔧 Technical Details

### Database Schema
The `song_requests` table includes:
- `id`: Auto-incrementing primary key
- `customer_name`: Customer's full name
- `customer_email`: Customer's email address
- `customer_phone`: Customer's phone number with country code
- `celebration`: Type of celebration (Birthday, Anniversary, etc.)
- `genre`: Music genre preference
- `recipient_name`: Name of the person the song is for
- `recipient_gender`: Gender of the recipient
- `status`: Order status (pending, processing, completed, cancelled)
- `price`: Order total price
- `created_at`: Timestamp when order was created
- `updated_at`: Timestamp when order was last updated

### Security
- Row Level Security (RLS) enabled
- Anonymous users can insert orders (form submissions)
- Authenticated users can read and update orders (admin dashboard)

## 🎨 Customization

### Styling
The dashboard uses Tailwind CSS with custom colors:
- `custom-orange`: #fc6900 (primary action color)
- `custom-dark`: #080808 (text color)
- `custom-gray`: #232321 (secondary text)
- `custom-beige`: #f3f1eb (background)

### Adding Features
To add new features to the dashboard:
1. Update the database schema if needed
2. Modify the `loadOrders()` function to fetch new data
3. Update the `renderOrders()` function to display new fields
4. Add new action buttons as needed

## 🐛 Troubleshooting

### Common Issues
1. **"No session found" error**: Make sure you're logged in to the admin dashboard
2. **Orders not appearing**: Check browser console for Supabase connection errors
3. **Form submission fails**: Verify Supabase credentials and table permissions

### Development Tools
- **Test Order Button**: Red button in bottom-right corner (localhost only)
- **Browser Console**: Check for JavaScript errors
- **Supabase Logs**: Monitor database operations in Supabase dashboard

## 📱 Mobile Support
The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Production Considerations
Before deploying to production:
1. Change admin credentials
2. Remove test order button
3. Set up proper authentication
4. Configure CORS settings
5. Set up email notifications
6. Add proper error logging
