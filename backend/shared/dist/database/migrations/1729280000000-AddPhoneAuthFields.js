"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPhoneAuthFields1729280000000 = void 0;
class AddPhoneAuthFields1729280000000 {
    constructor() {
        this.name = 'AddPhoneAuthFields1729280000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "marketing_opt_in" boolean NOT NULL DEFAULT false
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "verification_code" varchar(6)
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "verification_code_expiry" timestamptz
    `);
        await queryRunner.query(`
      CREATE INDEX "IDX_users_verification_code" ON "users" ("verification_code")
      WHERE "verification_code" IS NOT NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_verification_code"`);
        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "verification_code_expiry"
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "verification_code"
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "marketing_opt_in"
    `);
    }
}
exports.AddPhoneAuthFields1729280000000 = AddPhoneAuthFields1729280000000;
//# sourceMappingURL=1729280000000-AddPhoneAuthFields.js.map