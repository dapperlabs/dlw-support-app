# Dapper Legacy Wallet Support App

This app allows a user to administer their Dapper Legacy Wallet pending Google making the plugin obsolete.

The app is available at:

```https://dapperlabs.github.io/dlw-support-app/```

and uses GitHub pages to create a build of the `main` branch

## Dev notes

Create a .env file:

```
DOCKERFILE=Dockerfile.dev
CONTAINER_NAME=dlw-support-app
PORT=5952
VITE_APP_CHAIN_ID=0x1
```

To run in development mode cd to the root directory and run:

```yarn && yarn dev```

There is also a docker container which you can run by building:

```docker compose up --build -d```

...and then exec into this container:

```docker exec -it dw-escape-hatch sh```

...and run the yarn commands:

```yarn && yarn dev```

The app will be available here: http://localhost:5952

## Build notes

Change up the .env file:

```
DOCKERFILE=Dockerfile
CONTAINER_NAME=dw-escape-hatch
PORT=5952
VITE_APP_CHAIN_ID=0x1
```

and then run

```docker compose up --build -d```

After a short wait the build will be available here: http://localhost:5952

The app uses a typescript build of the Vite framework: https://vite.dev/guide/

## Testing

```yarn test:coverage```
