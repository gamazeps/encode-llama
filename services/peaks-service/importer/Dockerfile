FROM openjdk:8-jdk-alpine as build
COPY . /src
RUN ls -l /src/scripts/build.sh
RUN /src/scripts/build.sh

FROM openjdk:8-jre-alpine
COPY --from=build /src/build/peaks-importer-*.jar /app/peaks-importer.jar
