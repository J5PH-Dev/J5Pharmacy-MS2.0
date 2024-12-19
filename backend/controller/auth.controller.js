const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendPasswordResetEmail } = require('../utils/emailService');

// PMS Login (Admin/Manager)
const pmsLogin = async (req, res) => {
    try {
        const { employee_id, password } = req.body;
        console.log('Attempting PMS login for employee_id:', employee_id);

        // Get user from database
        const [users] = await db.pool.query(
            'SELECT * FROM users WHERE employee_id = ? AND is_active = 1',
            [employee_id]
        );

        if (users.length === 0) {
            console.log('No user found with employee_id:', employee_id);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for employee_id:', employee_id);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id,
                role: user.role,
                employeeId: user.employee_id,
                name: user.name,
                branchId: user.branch_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        console.log('Successful PMS login for employee_id:', employee_id);
        res.json({
            token,
            user: {
                name: user.name,
                role: user.role,
                employeeId: user.employee_id,
                branchId: user.branch_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POS Login (Pharmacist)
const posLogin = async (req, res) => {
    try {
        const { pin_code } = req.body;
        console.log('Attempting POS login with PIN:', pin_code);

        // Get pharmacist from database
        const [pharmacists] = await db.pool.query(
            'SELECT * FROM pharmacist WHERE pin_code = ? AND is_active = 1',
            [pin_code]
        );

        console.log('Query result:', pharmacists);

        if (pharmacists.length === 0) {
            console.log('No pharmacist found with PIN:', pin_code);
            return res.status(401).json({ message: 'Invalid PIN code' });
        }

        const pharmacist = pharmacists[0];
        console.log('Found pharmacist:', pharmacist.name);

        // Start a database transaction
        await db.pool.query('START TRANSACTION');

        try {
            // First, create a sales session with the pharmacist's branch_id
            const [salesSessionResult] = await db.pool.query(
                'INSERT INTO sales_sessions (branch_id, start_time) VALUES (?, NOW())',
                [pharmacist.branch_id]
            );

            const sessionId = salesSessionResult.insertId;

            // Then create the pharmacist session
            await db.pool.query(
                'INSERT INTO pharmacist_sessions (session_id, staff_id, share_percentage) VALUES (?, ?, 100.00)',
                [sessionId, pharmacist.staff_id]
            );

            // If everything is successful, commit the transaction
            await db.pool.query('COMMIT');

            // Generate JWT token
            const token = jwt.sign(
                { 
                    staffId: pharmacist.staff_id,
                    name: pharmacist.name,
                    branchId: pharmacist.branch_id,
                    sessionId: sessionId
                },
                process.env.JWT_SECRET,
                { expiresIn: '12h' }
            );

            console.log('Successful POS login for pharmacist:', pharmacist.name);
            res.json({
                token,
                pharmacist: {
                    name: pharmacist.name,
                    staffId: pharmacist.staff_id,
                    branchId: pharmacist.branch_id,
                    sessionId: sessionId
                }
            });
        } catch (error) {
            // If there's an error, rollback the transaction
            await db.pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('POS Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Generate a random 6-digit token
const generateResetToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store reset tokens with expiry (15 minutes)
const resetTokens = new Map();

const forgotPassword = async (req, res) => {
    const { employee_id, email } = req.body;

    try {
        // Check if user exists with given employee_id and email
        const [users] = await db.pool.query(
            'SELECT * FROM users WHERE employee_id = ? AND email = ?',
            [employee_id, email]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No user found with the provided employee ID and email'
            });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        
        // Store token with expiry
        resetTokens.set(employee_id, {
            token: resetToken,
            expiry: Date.now() + 15 * 60 * 1000 // 15 minutes
        });

        // Send reset email
        await sendPasswordResetEmail(email, resetToken);

        res.json({
            success: true,
            message: 'Password reset instructions have been sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset request'
        });
    }
};

const verifyResetToken = async (req, res) => {
    const { employee_id, token } = req.body;

    const storedReset = resetTokens.get(employee_id);
    if (!storedReset || storedReset.token !== token) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    if (Date.now() > storedReset.expiry) {
        resetTokens.delete(employee_id);
        return res.status(400).json({
            success: false,
            message: 'Reset token has expired'
        });
    }

    res.json({
        success: true,
        message: 'Token verified successfully'
    });
};

const resetPassword = async (req, res) => {
    const { employee_id, token, new_password } = req.body;

    const storedReset = resetTokens.get(employee_id);
    if (!storedReset || storedReset.token !== token) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password in database
        await db.pool.query(
            'UPDATE users SET password = ? WHERE employee_id = ?',
            [hashedPassword, employee_id]
        );

        // Clear the reset token
        resetTokens.delete(employee_id);

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
};

module.exports = {
    pmsLogin,
    posLogin,
    forgotPassword,
    verifyResetToken,
    resetPassword
}; 