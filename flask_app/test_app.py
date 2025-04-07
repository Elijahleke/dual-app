# test_app.py
import pytest
from unittest.mock import patch, MagicMock
from flask_app.app import app, get_data

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@patch('flask_app.app.psycopg2.connect')
def test_get_data(mock_connect):
    # Setup mock
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [('Precious',), ('Debby',)]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_connect.return_value = mock_conn

    result = get_data()
    assert result == ['Precious', 'Debby']
    mock_connect.assert_called_once()

@patch('flask_app.app.get_data')
def test_home_route(mock_get_data, client):
    mock_get_data.return_value = ['Precious']
    response = client.get('/')
    assert response.status_code == 200
    assert b'Precious' in response.data

    #debby testing her push