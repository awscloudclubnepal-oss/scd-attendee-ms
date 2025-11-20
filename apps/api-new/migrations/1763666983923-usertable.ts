import { MigrationInterface, QueryRunner } from "typeorm";

export class Usertable1763666983923 implements MigrationInterface {
    name = 'Usertable1763666983923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'volunteer')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'volunteer', CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "attendee" DROP COLUMN "check_in_time"`);
        await queryRunner.query(`ALTER TABLE "attendee" ADD "check_in_time" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendee" DROP COLUMN "check_in_time"`);
        await queryRunner.query(`ALTER TABLE "attendee" ADD "check_in_time" TIMESTAMP NOT NULL`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
