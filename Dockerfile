FROM docker.io/library/cloakbrowser:151-poc-v2

# Replace start-cdp.sh with a version that uses --user-data-dir
# pointing to the persistent volume mount at /home/clawbrowser/profile
COPY start-cdp.sh /opt/clawbrowser/start-cdp.sh
RUN chmod +x /opt/clawbrowser/start-cdp.sh
