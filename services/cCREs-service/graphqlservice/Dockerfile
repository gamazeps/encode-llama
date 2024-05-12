FROM node:14 AS build

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY ./package.json /app
COPY ./yarn.lock /app
RUN apt-get -y update && apt-get -y install python build-essential libpq-dev && yarn

# Bundle app source
COPY . /app/
RUN yarn build && yarn --production && apt-get -y remove build-essential python

# Copy build into new smaller docker container
FROM node:14
RUN apt-get -y update && apt-get -y install libpq-dev && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
WORKDIR /app
EXPOSE 3000
CMD [ "yarn", "start" ]
