import os
import urllib2
import math
import sys
from multiprocessing.pool import ThreadPool as Pool


class Point():

    def __init__(self, lat, lng):
        self.lat = lat
        self.lng = lng

    def __eq__(self, other):
        return self.lat == other.lat and self.lng == other.lng

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash((self.lat, self.lng))

    def clone(self, delta_lat=0, delta_lng=0):
        return Point(self.lat + delta_lat, self.lng + delta_lng)

    def to_lat_lng(self):
        return (self.lat, self.lng)

    @property
    def x(self):
        return self.lng

    @property
    def y(self):
        return self.lat


class Tile():

    __repr_template = '{x: %(x)s, y: %(y)s, zoom: %(zoom)s}'

    def __init__(self, x, y, zoom):
        self.x = x
        self.y = y
        self.zoom = zoom

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y and self.zoom == other.zoom

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash((self.x, self.y, self.zoom))

    def __repr__(self):
        return self.apply_template(self.__repr_template)

    def apply_template(self, template):
        return template % {'x': self.x, 'y': self.y, 'zoom': self.zoom}


class Templates():

    def __init__(self, url_template, save_file_path_template):
        self.url_template = url_template
        self.save_file_path_template = save_file_path_template


def get_length(point1, point2):
    return math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2)


def get_angle(point1, point2, point3):
    side12 = get_length(point1, point2)
    side13 = get_length(point1, point3)
    side23 = get_length(point2, point3)
    if side12 == 0 or side13 == 0:
        return 0
    value = min(max((side12 ** 2 + side13 ** 2 - side23 ** 2) / (2 * side12 * side13), -1), 1)
    return math.acos(value)


def get_top_point(points):
    top_point = Point(sys.maxint, None)
    for lat, lng in points:
        if lat < top_point.lat:
            top_point = Point(lat, lng)
    return top_point


def get_next_polygon_point(angle_point, first_end_point, points):
    next_point = angle_point
    next_angle = 0
    for lat, lng in points:
        current_point = Point(lat, lng)
        current_angle = get_angle(angle_point, first_end_point, current_point)
        if current_angle > next_angle or\
           current_angle == next_angle and\
           get_length(angle_point, current_point) > get_length(angle_point, next_point):
            next_angle = current_angle
            next_point = current_point
    return next_point


def get_polar_polygon_from_points(points):
    top_point = get_top_point(points)
    polygon_points = [top_point]
    while True:
        angle_point = polygon_points[-1]
        first_end_point = polygon_points[-2] if len(polygon_points) > 1 else angle_point.clone(delta_lat=1)
        next_point = get_next_polygon_point(angle_point, first_end_point, points)
        if top_point != next_point:
            polygon_points.append(next_point)
        else:
            break
    return polygon_points


def polar_to_int(lat, lng, zoom):
    x = int(2 ** zoom * (180 + lng) / 360)
    d = min(max(math.sin(lat * math.pi / 180), -0.9999), 0.9999)
    y = int(2 ** zoom * (2 * math.pi - math.log((1 + d) / (1 - d))) / (4 * math.pi))
    return Tile(x, y, zoom)


def polar_to_int_polygon(polar_polygon, zoom):
    return [polar_to_int(lat, lng, zoom) for lat, lng in polar_polygon]


def get_int_polygon_rectangle(int_polygon):
    x_top_left = sys.maxint
    y_top_left = sys.maxint
    x_bottom_right = 0
    y_bottom_right = 0
    zoom = int_polygon[0].zoom
    for point in int_polygon:
        x_top_left = min(x_top_left, point.x)
        y_top_left = min(y_top_left, point.y)
        x_bottom_right = max(x_bottom_right, point.x)
        y_bottom_right = max(y_bottom_right, point.y)
    return Tile(x_top_left, y_top_left, zoom), Tile(x_bottom_right, y_bottom_right, zoom)


def check_point_in_int_polygon(tile, int_polygon, imprecision=0.1):
    for polygon_point in int_polygon:
        if polygon_point == tile:
            return True
    angle_sum = 0
    for i in xrange(0, len(int_polygon)):
        tile1 = int_polygon[i]
        tile2 = int_polygon[i + 1] if i + 1 != len(int_polygon) else int_polygon[0]
        angle_sum += get_angle(tile, tile1, tile2)
    return angle_sum >= 2 * math.pi - imprecision


def create_dirs(save_file_path):
    dir_name = os.path.dirname(save_file_path)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)


def download_tile(tile, templates):
    url = tile.apply_template(templates.url_template)
    save_file_path = tile.apply_template(templates.save_file_path_template)
    create_dirs(save_file_path)
    with open(save_file_path, 'wb') as file:
        file.write(urllib2.urlopen(url).read())


def check_and_download_tile(tile, templates, int_polygon):
    if not check_point_in_int_polygon(tile, int_polygon):
        return
    download_tile(tile, templates)


def download_tiles_in_polar_polygon(polar_polygon, zooms, templates, threads_count=10):
    for zoom in zooms:
        int_polygon = polar_to_int_polygon(polar_polygon, zoom)
        point_top_left, point_bottom_right = get_int_polygon_rectangle(int_polygon)

        threads_pull = Pool(threads_count)

        for x in xrange(point_top_left.x, point_bottom_right.x + 1):
            for y in xrange(point_top_left.y, point_bottom_right.y + 1):
                threads_pull.apply_async(check_and_download_tile,
                    [Tile(x, y, zoom), templates, int_polygon])

        threads_pull.close()
        threads_pull.join()


if __name__ == '__main__':
    from fixtures import all_points
    url_template = 'http://mt0.googleapis.com/vt?src=apiv3&x=%(x)s&y=%(y)s&z=%(zoom)s'
    save_file_path_template = 'site/cache/%(zoom)s/%(x)s_%(y)s.png'
    zooms = xrange(15 + 1)
    polar_polygon = [point.to_lat_lng() for point in get_polar_polygon_from_points(all_points)]
    download_tiles_in_polar_polygon(polar_polygon, zooms, Templates(url_template, save_file_path_template))
