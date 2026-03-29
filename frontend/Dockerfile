FROM nginx:1.27-alpine

COPY nginx.conf  /etc/nginx/conf.d/default.conf
COPY index.html  /usr/share/nginx/html/index.html
COPY signin.html /usr/share/nginx/html/signin.html
COPY signup.html /usr/share/nginx/html/signup.html
COPY js/         /usr/share/nginx/html/js/

EXPOSE 80
