import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm';
import { IsEmail } from 'class-validator';

@Entity()
export class Tb_klient {
	@PrimaryColumn()
	id_klient: number;

	@Column()
	name: string;

	@Column()
	@IsEmail()
	email: string;

	@Column()
	pw: string;
}
