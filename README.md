# CO-Q
The ultimate music app for your event.

## Prerequisites
- git cli
- Node.js >v8.0

## Setup
1. If you haven't already, install [Node.js](https://nodejs.org/dist/v8.6.0/node-v8.6.0.pkg).

2. Clone the repository and change directory into it.
    ```bash
    $ git clone https://github.com/themaxsandelin/co-q && cd co-q
    ```
3. Install npm dependencies.
    ```bash
    $ npm install
    ```
4. Create a local `.env` file by copying the `.env-example` file, and provide your app's ID and Secret.
    ```bash
    $ cp .env-example .env
    ```
5. Download a private key for the Firebase Admin SDK.

    1. Navigate to [Service accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk) and select the CO-Q project.

    2. Click the **Generate New Private Key** button and it will download the `.json` file.

    3. Rename the `.json` file to `serviceAccountKey.json` and place it in the project's root directory.


6. Run the site script.
    ```bash
    $ npm run site
    ```

7. Hack away! 🎉


## License
[MIT](LICENSE) © [Max Sandelin](https://github.com/themaxsandelin)
