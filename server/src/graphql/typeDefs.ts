import { gql } from "apollo-server";

export const typeDefs = gql`
input CreateMessageInput {
  content: String!
  messageRoomId: String!
}

scalar DateTime

enum Gender {
  FEMALE
  MALE
}

enum LikeStatus {
  MATCHED
  PENDING
  SKIPPED
}

type Me {
  age: Int!
  gender: Gender!
  id: ID!
  livingPref: String!
  nickName: String!
  photoPaths: [String!]!
  photoUrls: [String!]!
}

type Message {
  content: String!
  createdAt: DateTime!
  id: ID!
  mine: Boolean!
  user: User!
}

type MessageConnection {
  edges: [MessageEdge!]!
  pageInfo: PageInfo!
}

type MessageEdge {
  cursor: DateTime!
  node: Message!
}

type MessageRoom {
  id: ID!
  lastMessage: Message!
  messages(input: PageInput!): MessageConnection!
  partner: User!
}

type MessageRoomConnection {
  edges: [MessageRoomEdge!]!
  pageInfo: PageInfo!
}

type MessageRoomEdge {
  cursor: DateTime!
  node: MessageRoom!
}

type Mutation {
  access: Me!
  createMessage(input: CreateMessageInput!): Message!
  like(userId: ID!): User!
  signUp(input: SignUpInput!): Me!
  skip(userId: ID!): User!
  unlike(userId: ID!): User!
  updateUser(input: UpdateUserInput!): Me!
}

type PageInfo {
  endCursor: DateTime
  hasNextPage: Boolean
}

input PageInput {
  after: DateTime
  first: Int!
}

type Query {
  me: Me!
  messageRoom(id: ID!): MessageRoom!
  messageRooms(input: PageInput!): MessageRoomConnection!
  newMessageRooms(input: PageInput!): MessageRoomConnection!
  receiveLikeUsers: [User!]!
  sendLikeUsers(input: PageInput!): UserConnection!
  user(id: ID!): User!
  users(input: PageInput!): UserConnection!
}

input SignUpInput {
  email: String!
  password: String!
}

type Subscription {
  newMessage: Message!
}

input UpdateUserInput {
  age: Int!
  gender: Gender!
  livingPref: String!
  nickName: String!
  photoPaths: [String!]!
}

type User {
  age: Int!
  gender: Gender!
  id: ID!
  livingPref: String!
  nickName: String!
  photoUrls: [String!]!
  topPhotoUrl: String
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  cursor: DateTime!
  node: User!
}
`;
