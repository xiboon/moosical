import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import Style from "../styles/Auth.module.scss";
import { useUser } from "../utils/useUser";
async function onSubmit(setAlert: (alert: string) => void) {
	const name = (document.getElementById("name") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement)
		.value;
	if (!name || !password) {
		return setAlert("Please fill in all of the fields");
	}
	const response = await fetch(`${import.meta.env.VITE_API_URL}/users/auth`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ name, password }),
	});
	if (response.ok) {
		location.href = "/";
	} else {
		setAlert("Invalid username or password");
	}
}
export const Auth: React.FC = () => {
	const { user } = useUser("me");
	const navigate = useNavigate();

	if (user?.name) {
		console.log("b");
		navigate("/");
	}

	const [alert, setAlert] = useState("");
	const [images, setImages] = useState<number[]>([]);
	const { data, error, isLoading } = useSWR("/songs/amount");

	useEffect(() => {
		if (!data?.amount) return;
		setImages(
			new Array(32)
				.fill(1)
				.map(() => Math.floor(Math.random() * data.amount))
				.filter((v, i, a) => a.indexOf(v) === i)
				.slice(0, 32),
		);
		// setImages((v) => [...v, ...v].sort(Math.random));
		// setImages([
		// 	145, 148, 133, 131, 132, 94, 67, 193, 219, 244, 281, 293, 304, 399, 458,
		// 	305, 145, 148,
		// ]);
	}, [data]);
	if (isLoading) return null;
	if (error) {
		console.error(error);
		return null;
	}

	return (
		<div className={`${Style.main} auth`}>
			<div className={Style.formParent}>
				<h1 className={Style.title}>welcome back</h1>
				<p className={Style.description}>log in to enjoy your moosic</p>
				<div className={Style.form}>
					<input id="name" placeholder="Username" type="text" />
					<input id="password" placeholder="Password" type="password" />
				</div>
				<button
					type="submit"
					className={Style.button}
					onClick={() => onSubmit(setAlert)}
				>
					Log in
				</button>
				<p className={Style.alert}>{alert}</p>
			</div>
			<div className={Style.bg}>
				<div>
					{images.map((v) => (
						<img
							key={v}
							src={`${import.meta.env.VITE_API_URL}/songs/${v}/cover`}
							alt="song cover"
							className={Style.album}
						/>
					))}
				</div>
				<div>
					{images.map((v) => (
						<img
							key={v}
							src={`${import.meta.env.VITE_API_URL}/songs/${v}/cover`}
							alt="song cover"
							className={Style.album}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
