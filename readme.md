docker run --rm --name oidc-container \
-e POSTGRES_USER=root -e POSTGRES_PASSWORD=root \
-v oidc_server:/var/lib/postgresql/data \
-p 5432:5432 -d postgres:16