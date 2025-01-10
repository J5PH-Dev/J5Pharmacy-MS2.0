const db = require('../config/database');
const { getConvertTZString } = require('../utils/timeZoneUtil');

// Get dashboard overview data
const getDashboardOverview = async (req, res) => {
    try {
        const [results] = await db.pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(${getConvertTZString('created_at')}) = CURDATE() THEN total_amount ELSE 0 END), 0) as todaySales,
                (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as totalProducts,
                (SELECT COUNT(*) FROM sales) as totalOrders,
                (SELECT COUNT(DISTINCT customer_id) FROM sales WHERE customer_id IS NOT NULL) as totalCustomers
            FROM sales
        `);

        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};

// Get recent transactions with enhanced details
const getRecentTransactions = async (req, res) => {
    try {
        const [transactions] = await db.pool.query(`
            SELECT 
                s.id as transaction_id,
                s.invoice_number,
                ${getConvertTZString('s.created_at')} as created_at,
                CAST(s.total_amount AS DECIMAL(10,2)) as total_amount,
                s.payment_method,
                s.payment_status,
                b.branch_name
            FROM sales s
            LEFT JOIN branches b ON s.branch_id = b.branch_id
            ORDER BY s.created_at DESC
            LIMIT 5
        `);

        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        res.status(500).json({ message: 'Error fetching recent transactions', error: error.message });
    }
};

// Get low stock items with enhanced metrics
const getLowStockItems = async (req, res) => {
    try {
        const [items] = await db.pool.query(`
            SELECT DISTINCT
                p.id,
                p.name,
                p.brand_name,
                p.barcode,
                p.critical,
                c.name as category_name,
                GROUP_CONCAT(
                    CASE 
                        WHEN bi.stock <= p.critical 
                        THEN CONCAT(b.branch_name, ': ', bi.stock) 
                    END
                    ORDER BY b.branch_name
                    SEPARATOR ', '
                ) as critical_branches
            FROM products p
            LEFT JOIN category c ON p.category = c.category_id
            JOIN branch_inventory bi ON p.id = bi.product_id
            JOIN branches b ON bi.branch_id = b.branch_id
            WHERE bi.stock <= p.critical
                AND p.is_active = 1
                AND bi.is_active = 1
            GROUP BY p.id, p.name, p.brand_name, p.barcode, p.critical, c.name
            ORDER BY 
                MIN(bi.stock) ASC,
                p.name ASC
            LIMIT 5
        `);

        // Format the response
        const formattedItems = items.map(item => ({
            id: item.id,
            name: item.brand_name ? `${item.name} (${item.brand_name})` : item.name,
            barcode: item.barcode,
            category_name: item.category_name,
            critical: item.critical,
            critical_branches: item.critical_branches
        }));

        res.json({ items: formattedItems });
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
    }
};

module.exports = {
    getDashboardOverview,
    getRecentTransactions,
    getLowStockItems
}; 