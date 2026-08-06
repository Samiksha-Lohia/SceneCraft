import BaseRepository from './base.repository.js';
import User from '../models/user.model.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, projection = null, options = {}) {
    return this.findOne({ email }, projection, options);
  }
}

const userRepositoryInstance = new UserRepository();
export default userRepositoryInstance;
export { UserRepository };
