FROM golang:1.15-alpine@sha256:fc801399d044a8e01f125eeb5aa3f160a0d12d6e03ba17a1d0b22ce50dfede81 AS builder

WORKDIR /go/src/tracking-issue
COPY main.go .

RUN go mod init tracking-issue
RUN CGO_ENABLED=0 go install .

FROM sourcegraph/alpine:3.12@sha256:133a0a767b836cf86a011101995641cf1b5cbefb3dd212d78d7be145adde636d
# TODO(security): This container should not be running as root!
# hadolint ignore=DL3002
USER root

# hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates

COPY --from=builder /go/bin/* /usr/local/bin/

ENTRYPOINT ["tracking-issue"]
