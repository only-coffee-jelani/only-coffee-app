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
      ADD COLUMN "marketingOptIn" boolean NOT NULL DEFAULT false,
      ADD COLUMN "verificationCode" varchar(6),
      ADD COLUMN "verificationCodeExpiry" timestamptz
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "marketingOptIn",
      DROP COLUMN "verificationCode",
      DROP COLUMN "verificationCodeExpiry"
    `);
    }
}
exports.AddPhoneAuthFields1729280000000 = AddPhoneAuthFields1729280000000;
//# sourceMappingURL=1729280000000-AddPhoneAuthFields.js.map