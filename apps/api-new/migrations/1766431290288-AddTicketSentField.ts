import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketSentField1766431290288 implements MigrationInterface {
    name = 'AddTicketSentField1766431290288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendee" ADD "ticket_sent" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendee" DROP COLUMN "ticket_sent"`);
    }

}
