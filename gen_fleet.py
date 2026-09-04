#!/usr/bin/env python3
"""Generate a hypeman.compose.yaml for N CloakBrowser deployments.

Each deployment gets:
- Its own Hypeman instance (isolated microVM)
- Its own persistent volume (browser profile survives restarts)
- Its own CDP ingress port on the host

Usage:
    python3 gen_fleet.py --count 10 --start-port 9301 --output hypeman.compose.yaml
    hypeman compose up --wait --wait-timeout 600s
"""
import argparse
import sys

ENTRYPOINT_SCRIPT = """\
        set -e
        Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp -noreset +extension RANDR &
        for i in $(seq 1 40); do [ -S /tmp/.X11-unix/X99 ] && break; sleep 0.25; done
        socat TCP-LISTEN:9223,bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:9222 &
        export DISPLAY=:99
        export HOME=/home/clawbrowser
        exec /opt/clawbrowser/clawbrowser.real \\
          --no-sandbox --no-first-run --no-default-browser-check \\
          --disable-dev-shm-usage \\
          --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --remote-allow-origins=* \\
          --user-data-dir=/home/clawbrowser/profile \\
          --window-size=1920,1080 about:blank
"""

SERVICE_TEMPLATE = """\
  cloak-profile-{idx:02d}:
    image: docker.io/library/cloakbrowser:151-poc-v2
    resources:
      vcpus: {vcpus}
      memory: {memory}
    env:
      HOME: /home/clawbrowser
    entrypoint:
      - bash
      - -c
      - |
{entrypoint}
    volumes:
      - volume: cloak-data-{idx:02d}
        mount_path: /home/clawbrowser/.config/clawbrowser
    healthcheck:
      type: http
      http:
        port: 9223
        path: /json/version
        scheme: http
        expected_status: 200
      interval: 10s
      timeout: 5s
      start_period: 40s
      failure_threshold: 5
    restart:
      policy: on_failure
      backoff: 5s
    ingress:
      - hostname: localhost
        host_port: {port}
        target_port: 9223
"""

VOLUME_TEMPLATE = """\
  cloak-data-{idx:02d}:
    name: cloak-data-{idx:02d}
    size_gb: {volume_gb}
"""


def main():
    parser = argparse.ArgumentParser(description="Generate CloakBrowser fleet compose file")
    parser.add_argument("--count", type=int, default=10, help="Number of deployments")
    parser.add_argument("--start-port", type=int, default=9301, help="First CDP host port")
    parser.add_argument("--output", "-o", default="hypeman.compose.yaml", help="Output file")
    parser.add_argument("--vcpus", type=int, default=2, help="vCPUs per instance")
    parser.add_argument("--memory", default="2GB", help="Memory per instance")
    parser.add_argument("--volume-gb", type=int, default=5, help="Volume size in GB per profile")
    args = parser.parse_args()

    lines = []
    lines.append('name: cloakbrowser-fleet')
    lines.append('version: 1')
    lines.append('services:')

    # Indent the entrypoint script for YAML block scalar
    indented_entrypoint = "\n".join("        " + line if line.strip() else "" for line in ENTRYPOINT_SCRIPT.strip().split("\n"))

    for i in range(1, args.count + 1):
        port = args.start_port + (i - 1)
        service = SERVICE_TEMPLATE.format(
            idx=i,
            port=port,
            vcpus=args.vcpus,
            memory=args.memory,
            entrypoint=indented_entrypoint,
        )
        lines.append(service)

    lines.append('volumes:')
    for i in range(1, args.count + 1):
        vol = VOLUME_TEMPLATE.format(idx=i, volume_gb=args.volume_gb)
        lines.append(vol)

    output = "\n".join(lines)

    with open(args.output, 'w') as f:
        f.write(output)

    print(f"Generated {args.output} with {args.count} deployments", file=sys.stderr)
    print(f"CDP ports: {args.start_port}–{args.start_port + args.count - 1}", file=sys.stderr)
    print(f"Deploy with: hypeman compose up --wait --wait-timeout 600s", file=sys.stderr)


if __name__ == "__main__":
    main()
