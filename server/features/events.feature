Feature: Events

    @auth
    Scenario: Empty events list
        Given empty "events"
        When we get "/events"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new events item
        Given empty "users"
        Given empty "locations"
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        And we reset notifications
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "location": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "location": [{"qcode": "test qcaode", "name": "test name", "formatted_address": ""}]
            }]}
        """
        When we get "/events?sort=[("dates.start",1)]&source={"query":{"range":{"dates.start":{"lte":"2015-01-01T00:00:00.000Z"}}}}"
        Then we get list with 0 items
        When we get "/events?sort=[("dates.start",1)]&source={"query":{"range":{"dates.start":{"gte":"2016-01-02T00:00:00.000Z"}}}}"
        Then we get list with 1 items
        When we get "/events_history"
        Then we get a list with 1 items
        """
            {"_items": [{"operation": "create", "event_id": "#events._id#", "update": {"name": "event 123"}}]}
        """

    @auth
    @notification
    Scenario: Prevent to save an event with an existing unique_name
    When we post to "/events" with success
    """
    [
        {
            "unique_name": "JO",
            "name": "JO",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-18"
            }
        }
    ]
    """
    And we post to "/events"
    """
    [
        {
            "unique_name": "JO",
            "name": "JO 2022",
            "dates": {
                "start": "2016-01-10",
                "end": "2016-01-18"
            }
        }
    ]
    """
    Then we get error 400

    @auth
    Scenario: Event can be created only by user having privileges
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "events"
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we get error 403
        When we setup test user
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 1, "users": 1}}
        """
        Then we get OK response
        When we post to "events"
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we get OK response

    @auth
    @notification
    Scenario: Event can be modified only by user having privileges
        When we post to "events" with success
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we store "eventId" with value "#events._id#" to context
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/events/#eventId#"
        """
        {"name": "New Event"}
        """
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 1, "users": 1}}
        """
        Then we get OK response
        When we patch "/events/#eventId#"
        """
        {"name": "New Event"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated",
            "extra": {
                "item": "#eventId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Track publish history for event
        Given empty "users"
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        When we post to "/events/publish"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:published",
            "extra": {
                "item": "#events._id#",
                "state": "scheduled",
                "pubstatus": "usable"
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "event_id": "#events._id#",
                "operation": "create"
                },
                {
                "event_id": "#events._id#",
                "operation": "publish",
                "update": {"state": "scheduled"}
                }
            ]}
        """
        When we post to "/events/publish"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "cancelled"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unpublished",
            "extra": {
                "item": "#events._id#",
                "state": "killed",
                "pubstatus": "cancelled"
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 3 items
        """
            {"_items": [{
                "event_id": "#events._id#",
                "operation": "create"
                },
                {
                "event_id": "#events._id#",
                "operation": "publish",
                "update": {"state": "scheduled"}
                },
                {
                "event_id": "#events._id#",
                "operation": "publish",
                "update": {"pubstatus": "cancelled"}
                }
            ]}
        """

    @auth
    Scenario: Duplicate an event
        Given "vocabularies"
        """
        [{
            "_id": "eventoccurstatus",
                    "display_name": "Event Occurence Status",
                    "type": "manageable",
                    "unique_field": "qcode",
                    "items": [
                        {"is_active": true, "qcode": "eocstat:eos0", "name": "Unplanned event"},
                        {"is_active": true, "qcode": "eocstat:eos1", "name": "Planned, occurence planned only"},
                        {"is_active": true, "qcode": "eocstat:eos2", "name": "Planned, occurence highly uncertain"},
                        {"is_active": true, "qcode": "eocstat:eos3", "name": "Planned, May occur"},
                        {"is_active": true, "qcode": "eocstat:eos4", "name": "Planned, occurence highly likely"},
                        {"is_active": true, "qcode": "eocstat:eos5", "name": "Planned, occurs certainly"},
                        {"is_active": true, "qcode": "eocstat:eos6", "name": "Planned, then cancelled"}
                    ]
        }]
        """
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        Given empty "users"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        When we post to "/events/publish"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        When we post to "/events/#events._id#/duplicate"
        """
        [{}]
        """
        Then we get OK response
        When we get "/events/123"
        Then we get existing resource
        """
        {
            "_id": "123",
            "name": "event 123",
            "state": "scheduled",
            "duplicate_to": ["#duplicate._id#"]
        }
        """
        When we get "/events/#duplicate._id#"
        Then we get existing resource
        """
        {
            "_id": "#duplicate._id#",
            "name": "event 123",
            "state": "draft",
            "occur_status": {"qcode": "eocstat:eos5"},
            "duplicate_from": "123"
        }
        """
        When we get "/events_history"
        Then we get list with 6 items
        """
        {"_items": [
            {
                "operation": "create",
                "event_id": "123"
            },
            {
                "operation": "publish",
                "update": { "state" : "scheduled", "pubstatus": "usable" }
            },
            {
                "operation": "create",
                "event_id": "#duplicate._id#"
            },
            {
                "operation": "duplicate",
                "update": { "duplicate_id" : "#duplicate._id#"}
            },
            {
                "operation": "duplicate_from",
                "update": { "duplicate_id" : "123"}
            },
            {
                "operation": "update",
                "update": { "duplicate_to": ["#duplicate._id#"] }
            }
        ]}
        """

    @auth
    Scenario: Duplicate a recurrent event
        Given "vocabularies"
        """
        [{
            "_id": "eventoccurstatus",
                    "display_name": "Event Occurence Status",
                    "type": "manageable",
                    "unique_field": "qcode",
                    "items": [
                        {"is_active": true, "qcode": "eocstat:eos5", "name": "Planned, occurs certainly"}
                    ]
        }]
        """
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        Given empty "users"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "recurrence_id": "432",
                "previous_recurrence_id": "765",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03",
                    "recurring_rule" : {
                        "frequency" : "WEEKLY",
                        "until" : null,
                        "count" : 1,
                        "endRepeatMode" : "count",
                        "interval" : 1,
                        "byday" : "MO"
                    }
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        Then we store "eventId" with value "#events._id#" to context
        When we post to "/events/#eventId#/duplicate"
        """
        [{}]
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "_id": "#eventId#",
                "name": "event 123"
            },
            {
                "_id": "#duplicate._id#",
                "name": "event 123",
                "occur_status": {"qcode": "eocstat:eos5"}
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 5 items
        """
        {"_items": [
            {
                "operation": "create",
                "event_id": "#eventId#"
            },
            {
                "operation": "create",
                "event_id": "#duplicate._id#"
            },
            {
                "operation": "duplicate",
                "update": { "duplicate_id" : "#duplicate._id#"}
            },
            {
                "operation": "duplicate_from",
                "update": { "duplicate_id" : "#eventId#"}
            },
            {
                "operation": "update",
                "update": { "duplicate_to": ["#duplicate._id#"] }
            }
        ]}
        """
