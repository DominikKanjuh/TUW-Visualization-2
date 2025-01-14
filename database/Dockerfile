FROM postgis/postgis:14-3.5

ENV POSTGRES_DB=vis_2_geodb
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=your_password_here

COPY ./database/init-database.sh /docker-entrypoint-initdb.d/00-init-database.sh

COPY ./database/sql/*.sql /sql/

RUN chmod +x /docker-entrypoint-initdb.d/00-init-database.sh
