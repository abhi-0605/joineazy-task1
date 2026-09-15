CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE assignment_target AS ENUM ('all', 'groups');
CREATE TYPE submission_status AS ENUM ('pending', 'confirmed');


CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE groups(
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE group_members(
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);


CREATE TABLE assignments(
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    onedrive_link TEXT,
    target_type assignment_target NOT NULL DEFAULT 'all',
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE assignment_groups(
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, group_id)
);


CREATE TABLE submissions(
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    status submission_status NOT NULL DEFAULT 'pending',
    confirmed_by INT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(assignment_id, user_id)
);



CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);