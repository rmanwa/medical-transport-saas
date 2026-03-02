export class InviteStaffDto {
  name!: string;
  email!: string;
  /** Temporary password assigned by the admin. Staff should change it on first login. */
  password!: string;
  /** Branch IDs to assign the staff member to. */
  branchIds!: string[];
}