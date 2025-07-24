export interface IUserProps {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  birthDate?: Date | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: IUserProps) { }

  static create(props: IUserProps): User {
    if (!props.email || !props.name) {
      throw new Error('Missing required user fields.');
    }

    return new User(props);
  }

  get data(): IUserProps {
    return this.props;
  }
}
