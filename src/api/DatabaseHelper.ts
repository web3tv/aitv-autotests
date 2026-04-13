import mysql, { Connection } from 'mysql2/promise';

export class DatabaseHelper {
    private connection: Connection | null = null;

    constructor(
        private config = {
            host: process.env.DB_HOST!,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_NAME!,
        }
    ) {}

    async connect(): Promise<void> {
        this.connection = await mysql.createConnection(this.config);
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T> {
        if (!this.connection) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const [rows] = await this.connection.execute(sql, params);
        return rows as T;
    }

    async setActiveSubscription(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NOW(), expired_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['confirmed', email]
        );
    }

    async expireSubscription(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = DATE_SUB(NOW(), INTERVAL 60 DAY), expired_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['confirmed', email]
        );
    }

    async expireTransaction(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NULL, expired_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['expired', email]
        );
    }

    async setPendingPayment(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NULL, expired_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['new', email]
        );
    }

    async invalidateTransaction(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NULL, expired_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['invalid', email]
        );
    }
}
