export type Task = {
  id: string;
  title: string;
  /** Plain text; may be empty */
  description: string;
};

export type List = {
  id: string;
  title: string;
  tasks: Task[];
};

export type Board = {
  lists: List[];
};
