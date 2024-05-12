
FROM node:14 AS build

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY ./package.json /app
COPY ./yarn.lock /app
RUN yarn

# Bundle app source
COPY . /app/
RUN yarn build && yarn --production

# Copy build into new smaller docker container
FROM node:14
COPY --from=build /app /app
WORKDIR /app
EXPOSE 3000

# Install bash on Run Container
RUN apt-get -y -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update && apt-get -y install bash


# Install Java 8 on Run Container
RUN apt-get -y -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update && apt-get -y install openjdk-11-jdk
ENV JAVA_HOME=/usr/lib/jvm/java-1.11.0-openjdk-amd64

# Install Flyway
RUN wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/6.0.8/flyway-commandline-6.0.8-linux-x64.tar.gz | tar xvz && ln -s `pwd`/flyway-6.0.8/flyway /usr/local/bin

# Remove broken Java that comes with flyway installation
RUN rm -rf flyway-6.0.8/jre

ENV FLYWAY_LOCATIONS=filesystem:/app/db/migration

CMD scripts/migrate.sh && yarn start