export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface List {
  id: string;
  title: string;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  position: number;
  list_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ListWithTasks extends List {
  tasks: Task[];
}