# Rework

## Request

The first production post-deploy check failed while reading `render deploys list`: Render CLI 2.24.0
returns each deploy as a top-level object, while the checked-in command assumed the API wrapper shape
`{"deploy": ...}`.

## Change

The Operations post-deploy parser now accepts both the CLI's top-level object and the API's nested
object. No application code, service configuration, or acceptance behavior changed.

## Rechecked

- The corrected commit comparison was rerun against the live Render service.
- The full mechanical defence was rerun on the reworked branch before its follow-up merge.

## Net effect

The production check remains strict about the exact live commit, but now works with the Render CLI
version installed on this machine.
