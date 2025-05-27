account = Account.find_by_site('minjar.com'); nil
account_attribute = account.account_attribute; nil
account_uuid = account.uuid
config = {
  "sampling_rate": 1,
  "whitelist": [
    "users\\.custom_attributes\\.team",
    "users\\.custom_attributes\\.store",
    "users\\.custom_attributes\\.player",   
  ],
  "blacklist": [],
  "enabled": true
}.as_json
account_attribute.set_autocomplete_configuration(config)