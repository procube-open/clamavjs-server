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
    command:
      - --bind_ip_all
      - --keyFile 
      - /opt/keyfolder/keyfile
      - --replSet
      - rs0
    restart: always
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
      - ./init:/docker-entrypoint-initdb.d:ro
      - ./etc/keyfolder/keyfile:/opt/keyfolder/keyfile:ro
    networks:
      guacnetwork_compose:
    
  # clamav.js
  clamavjs:
    container_name: clamavjs
    build: ./clamavjs-server
    links:
      - mongo
      - clamav
    environment:
      DATABASE_URL: "mongodb://mongo:27017/files_db?authSource=admin"
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
      CLAMAV_CONTAINER_NAME: "clamav"
      CLAMAV_CONTAINER_PORT: "3310"
    networks:
      guacnetwork_compose:
    depends_on:
      mongo:
        condition: service_started
      clamav:
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