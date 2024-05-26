import { useUser } from "../utils/useUser";

export const Root: React.FC = () => {
	const { isLoading, user } = useUser("me");
	return isLoading ? (
		<h1> loading </h1>
	) : (
		<div>
			<h1>{user?.name}</h1>
			<h1>div</h1>
		</div>
	);
};
