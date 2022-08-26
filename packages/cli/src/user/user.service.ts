/* eslint-disable import/no-cycle */
import { EntityManager, In } from 'typeorm';
import { Db } from '..';
import { User } from '../databases/entities/User';

export class UserService {
	static async get(user: Partial<User>): Promise<User | undefined> {
		return Db.collections.User.findOne(user);
	}

	static async trxGetByIds(trx: EntityManager, ids: string[]) {
		return trx.find(User, { id: In(ids) });
	}
}
