FROM --platform=linux/amd64 nginx

WORKDIR /usr/share/react

COPY build build

RUN cp -a build/. /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

COPY .env .
COPY env.sh .
COPY default.conf /etc/nginx/conf.d/default.conf
RUN chmod +x env.sh

CMD ["/bin/bash", "-c", "./env.sh && nginx -g \"daemon off;\""]
