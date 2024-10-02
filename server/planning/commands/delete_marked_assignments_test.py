# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import flask

from .delete_marked_assignments import DeleteMarkedAssignments
from planning.tests import TestCase
from superdesk import get_resource_service
from superdesk.utc import utcnow
from datetime import timedelta
from bson import ObjectId
from unittest.mock import patch


now = utcnow()
yesterday = now - timedelta(hours=48)
two_days_ago = now - timedelta(hours=96)


class DeleteMarkedAssignmentsTest(TestCase):
    users = [{"_id": ObjectId()}, {"_id": ObjectId()}]

    auth = [
        {"_id": ObjectId(), "user": users[0]["_id"]},
        {"_id": ObjectId(), "user": users[1]["_id"]},
    ]

    assignments = [
        {"_id": ObjectId(), "_to_delete": True, "planning_item": "p1", "coverage_item": "c1"},
        {"_id": ObjectId(), "_to_delete": True, "planning_item": "p2", "coverage_item": "c1"},
        {"_id": ObjectId(), "planning_item": "p3"},
    ]
    plans = [{"_id": "p1"}, {"_id": "p2"}, {"_id": "p3"}]

    def setUp(self):
        super().setUp()
        self.assignment_service = get_resource_service("assignments")

    def assertAssignmentDeleted(self, assignment_indexes, not_deleted=False):
        for assignment_index in assignment_indexes:
            assignment_id = self.assignments[assignment_index]["_id"]
            assignment = self.assignment_service.find_one(_id=assignment_id, req=None)
            if not_deleted:
                self.assertIsNotNone(assignment)
            else:
                self.assertIsNone(assignment)

    def test_delete_marked_assignments(self):
        with self.app.app_context():
            self.app.data.insert("users", self.users)
            self.app.data.insert("auth", self.auth)
            self.app.data.insert("planning", self.plans)
            self.app.data.insert("assignments", self.assignments)

            flask.g.user = self.users[0]
            flask.g.auth = self.auth[0]


            with patch("planning.commands.delete_marked_assignments.push_notification") as notification_mock:
                DeleteMarkedAssignments().run()
                notification_mock.assert_called_once()

            self.assertAssignmentDeleted([0, 1])
            self.assertAssignmentDeleted([2], True)

            with patch("planning.commands.delete_marked_assignments.push_notification") as notification_mock:
                DeleteMarkedAssignments().run()
                notification_mock.assert_not_called()
