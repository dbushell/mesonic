# meSonic dev server
FROM ghcr.io/dbushell/ubuntu

COPY --from=caddy:latest /usr/bin/caddy /usr/bin/caddy

ENV MESONIC_MEDIA ${MESONIC_MEDIA:-/data}
ENV MESONIC_CONFIG ${MESONIC_CONFIG:-/config}
ENV MESONIC_DEV ${MESONIC_DEV:-0}
USER root

RUN apt update \
  && apt upgrade -y \
  && apt install -y ffmpeg sqlite3

RUN mkdir -p ${MESONIC_MEDIA} \
  && mkdir -p ${MESONIC_CONFIG} \
  && chown -R ${PUID}:${PGID} ${MESONIC_MEDIA} \
  && chown -R ${PUID}:${PGID} ${MESONIC_CONFIG}

COPY server/ ${HOME}/server
COPY client/ ${HOME}/client

RUN chown -R ${PUID}:${PGID} $HOME

WORKDIR ${HOME}
USER ${USER}

CMD ["/home/user/server/init.sh"]
