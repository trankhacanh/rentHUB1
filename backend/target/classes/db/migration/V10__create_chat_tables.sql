CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    equipment_id UUID,

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_conversation_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipments(id)
);

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY,

    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,

    joined_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_cp_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cp_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_conversation_user
        UNIQUE (conversation_id, user_id)
);


CREATE TABLE messages (
    id UUID PRIMARY KEY,

    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,

    content TEXT NOT NULL,

    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',

    created_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
);

CREATE TABLE message_reads (
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,

    read_at TIMESTAMPTZ NOT NULL,

    PRIMARY KEY (message_id, user_id),

    CONSTRAINT fk_message_read_message
        FOREIGN KEY (message_id)
        REFERENCES messages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_read_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
