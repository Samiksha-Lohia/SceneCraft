export class UserDto {
  constructor(user) {
    this.id = user._id || user.id;
    this.name = user.name;
    this.email = user.email;
    this.plan = user.plan;
    this.createdAt = user.createdAt;
  }

  static toResponse(user) {
    if (!user) return null;
    return new UserDto(user);
  }

  static toResponseList(users) {
    if (!Array.isArray(users)) return [];
    return users.map(user => new UserDto(user));
  }
}
