from data.direction import Direction


class RabbitInterpreter:
    @staticmethod
    def interpret(landmarks) -> tuple[Direction, float, float]:
        """Returns (facing, orientation, mouth)."""
        # TODO: implement rabbit-specific geometry
        return (Direction.RIGHT, 0.0, 0.0)
