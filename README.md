# clamavjs-server
## docker-compose
sample code
```
version: '2.0'

networks:
  guacnetwork_compose:
    driver: bridge

volumes:
  db:
services:
  # mongoDB  
  mongo:
    container_name: mongo
    hostname: mongo
    image: mongo:latest
    command: "--bind_ip_all --keyFile /opt/keyfolder/keyfile --replSet rs0"
    restart: on-failure
    environment:
      MONGO_INITDB_DATABASE: files_db
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
      MONGO_REPLICA_SET_NAME: rs0
    ports:
      - 27017:27017
    volumes:
      - ./db:/data/db
      - ./configdb:/data/configdb
    healthcheck:
      test: |
        test $$(mongosh --quiet -u root -p example --eval "try { rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongo:27017' }] }).ok } catch (_) { rs.status().ok }") -eq 1
      interval: 10s
      start_period: 120s
    networks:
      guacnetwork_compose:

  # clamav.js
  clamavjs:
    container_name: clamavjs
    build: ./clamav
    links:
      - mongo
      - clamav
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    networks:
      guacnetwork_compose:
    depends_on:
      mongo:
        condition: service_healthy

  #clamav
  clamav:
    container_name: clamav
    image: clamav/clamav
    volumes:
      - ./etc/clamav/clamav:/etc/clamav/
    networks:
      guacnetwork_compose:

```