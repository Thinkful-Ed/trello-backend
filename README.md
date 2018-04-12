# trello-backend

[GitHub](https://github.com/Thinkful-Ed/trello-backend)

[Postman API documentation](https://documenter.getpostman.com/view/2364768/trello-server/RVu8gSRz)

Backend for supporting arbitrary Trello front end clients

Note that this is not meant to be a robust, full-fledged Trello app backend. Its sole purpose is to provide a backend that can be run locally in order to demo front end apps that implement a UI for it.

## To get it running

1. Clone this repo
2. `cd` into it
3. Run `npm install`
4. Run `npm start`

By default, this will run the server on port 8080. And it will expect clients coming from localhost:3000. If you want non-default settings, set environment variables for `CLIENT_ORIGIN` and `SERVER_PORT` before running `npm start`.

## More details on what it do

This server supports basic CRUD ops for boards, lists, and cards.

The underlying app is extremely limited, and will not support the full range of features that real Trello supports. It supports creating, reading, updating, and deleting boards, lists, and cards.

It does not support re-ordering lists and cards, or anything beyond board names, list titles, and card text.

Here are some oddities and guidelines:

+ "Ceci n'est pas une vrai application" - specifically, it's got a volatile, in memory data store. Persistence you want? Look elsewhere.
+ CRUD ops for boards
    - When you read a board, you get all child components (i.e., any lists and their cards)
    - When you create a board, you only get to give it a name, and you cannot also create child lists and cards as part of same op.
    - When you delete a board, you delete all its child components
+ CRUD ops for lists
    - When you read a list, you get all child cards
    - When you create a list, you only get to give it a title, and you cannot also create child cards and cards as part of same op.
    - When you create a list, via the URL structure, you create it as a child of an existing board (i.e., POST /api/board/{{someBoardId}}/list)
    - When you update, read, or delete a list, you do so via a direct path to the list (e.g., DELETE /api/list/{{someListId}})
    - When you delete a list, you delete its card children, if any
+ CRUD ops for cards
    - When you create a card, you only get to give it text
    - When you create a card, via the URL structure, you create it as a child of an existing list (i.e., POST /api/list/{{someListid}/card)
    - When you update, read, or delete a card, you do so via a direct path to the list (e.g., DELETE /api/card/{{someCardId}})


Have fun!